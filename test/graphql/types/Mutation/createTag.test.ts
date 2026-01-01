import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";

import { usersTable } from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createTag,
	Mutation_createTagFolder,
	Mutation_deleteOrganization,
	Query_signIn,
} from "../documentNodes";

let cachedAdminAuth: {
	token: string;
	userId: string;
} | null = null;

// Helper function to get admin authentication token and user id
async function getAdminAuth() {
	if (cachedAdminAuth !== null) {
		return cachedAdminAuth;
	}
	try {
		if (
			!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ||
			!server.envConfig.API_ADMINISTRATOR_USER_PASSWORD
		) {
			throw new Error(
				"Admin credentials are missing in environment configuration",
			);
		}

		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		if (adminSignInResult.errors) {
			throw new Error(
				`Admin authentication failed: ${
					adminSignInResult.errors[0]?.message || "Unknown error"
				}`,
			);
		}
		assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);
		assertToBeNonNullish(adminSignInResult.data.signIn?.user?.id);

		cachedAdminAuth = {
			token: adminSignInResult.data.signIn.authenticationToken,
			userId: adminSignInResult.data.signIn.user.id,
		};

		return cachedAdminAuth;
	} catch (error) {
		throw new Error(
			`Failed to get admin authentication token: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}

// Helper function to create an organization
async function createOrganization(adminAuthToken: string): Promise<string> {
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					name: `Org ${faker.string.uuid()}`,
					countryCode: "us",
				},
			},
		},
	);

	if (createOrgResult.errors) {
		throw new Error(
			`Organization creation failed: ${JSON.stringify(createOrgResult.errors)}`,
		);
	}

	assertToBeNonNullish(createOrgResult.data?.createOrganization?.id);
	return createOrgResult.data.createOrganization.id;
}

// Helper function to add organization membership
async function addOrganizationMembership(params: {
	adminAuthToken: string;
	memberId: string;
	organizationId: string;
	role: "administrator" | "regular";
}) {
	const result = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: { authorization: `bearer ${params.adminAuthToken}` },
			variables: {
				input: {
					memberId: params.memberId,
					organizationId: params.organizationId,
					role: params.role,
				},
			},
		},
	);

	if (result.errors) {
		throw new Error(
			`Organization membership creation failed: ${JSON.stringify(result.errors)}`,
		);
	}
}

suite("Mutation field createTag", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const cleanup of testCleanupFunctions.reverse()) {
			try {
				await cleanup();
			} catch {
				// Cleanup errors are acceptable in tests
			}
		}
		testCleanupFunctions.length = 0;
	});

	suite("Authentication and Authorization", () => {
		test("Returns an error if the client is not authenticated", async () => {
			const result = await mercuriusClient.mutate(Mutation_createTag, {
				variables: {
					input: {
						name: "Test Tag",
						organizationId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createTag).toEqual(null);

			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["createTag"],
					}),
				]),
			);
		});

		test("Returns an error if the user is present in the token but not in the database", async () => {
			const regularUser = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId));

			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						name: "Test Tag",
						organizationId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createTag).toEqual(null);

			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["createTag"],
					}),
				]),
			);
		});

		test("Returns an error when a non-member regular user tries to create a tag", async () => {
			const [{ token: adminAuthToken }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const orgId = await createOrganization(adminAuthToken);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						name: "Test Tag",
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createTag).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "organizationId"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createTag"],
					}),
				]),
			);
		});

		test("Returns an error when an organization member without admin rights tries to create a tag", async () => {
			const [{ token: adminAuthToken }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const orgId = await createOrganization(adminAuthToken);

			await addOrganizationMembership({
				adminAuthToken,
				memberId: regularUser.userId,
				organizationId: orgId,
				role: "regular",
			});

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						name: "Test Tag",
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createTag).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "organizationId"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createTag"],
					}),
				]),
			);
		});

		test("Allows system administrator to create tag", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const tagName = `System Admin Tag ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: tagName,
						organizationId: orgId,
					},
				},
			});

			assertToBeNonNullish(result.data?.createTag);
			expect(result.data.createTag.name).toEqual(tagName);
			expect(result.errors).toBeUndefined();
		});

		test("Allows organization administrator to create tag", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			// Create a regular user and make them org admin
			const orgAdmin = await createRegularUserUsingAdmin();

			await addOrganizationMembership({
				adminAuthToken,
				memberId: orgAdmin.userId,
				organizationId: orgId,
				role: "administrator",
			});

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const tagName = `Org Admin Tag ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: {
					authorization: `bearer ${orgAdmin.authToken}`,
				},
				variables: {
					input: {
						name: tagName,
						organizationId: orgId,
					},
				},
			});

			assertToBeNonNullish(result.data?.createTag);
			expect(result.data.createTag.name).toEqual(tagName);
			expect(result.errors).toBeUndefined();
		});
	});

	suite("Input Validation", () => {
		test("Returns an error when invalid arguments are provided", async () => {
			const result = await mercuriusClient.mutate(Mutation_createTag, {
				variables: {
					input: {
						name: 123 as unknown as string,
						organizationId: "not-a-uuid",
					},
				},
			});

			expect(result.data?.createTag ?? null).toEqual(null);

			const errors = result.errors ?? [];
			expect(
				errors.some(
					(error) =>
						error.extensions?.code === "invalid_arguments" ||
						error.message.includes("got invalid value") ||
						error.message.includes("cannot represent a non string value") ||
						error.message.includes("Graphql validation error"),
				),
			).toBe(true);
		});

		test("Returns invalid_arguments error when name is empty", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "",
						organizationId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createTag).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "name"]),
								}),
							]),
						}),
						path: ["createTag"],
					}),
				]),
			);
		});

		test("Returns invalid_arguments error when name exceeds 256 characters", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "a".repeat(257),
						organizationId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createTag).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "name"]),
								}),
							]),
						}),
						path: ["createTag"],
					}),
				]),
			);
		});
	});

	suite("Resource Existence", () => {
		test("Returns an error when organization does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "Test Tag",
						organizationId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createTag).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "organizationId"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createTag"],
					}),
				]),
			);
		});

		test("Returns an error when folderId folder does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "Test Tag",
						organizationId: orgId,
						folderId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createTag).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "folderId"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createTag"],
					}),
				]),
			);
		});

		test("Returns an error when folderId folder belongs to different organization", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			// Create two organizations
			const orgId1 = await createOrganization(adminAuthToken);
			const orgId2 = await createOrganization(adminAuthToken);

			// Create a folder in org1
			const createFolderResult = await mercuriusClient.mutate(
				Mutation_createTagFolder,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: "Folder in Org1",
							organizationId: orgId1,
						},
					},
				},
			);

			assertToBeNonNullish(createFolderResult.data?.createTagFolder);
			const folderId = createFolderResult.data.createTagFolder.id;

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId1 } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId2 } },
				});
			});

			// Try to create a tag in org2 with folder from org1
			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: "Test Tag",
						organizationId: orgId2,
						folderId: folderId,
					},
				},
			});

			expect(result.data?.createTag).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "folderId"],
									message:
										"This tag does not belong to the associated organization.",
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createTag"],
					}),
				]),
			);
		});
	});

	suite("Duplicate Name Handling", () => {
		test("Returns an error when tag with same name already exists in organization", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const tagName = `Duplicate Tag ${faker.string.uuid()}`;

			// Create the first tag
			const createFirstTagResult = await mercuriusClient.mutate(
				Mutation_createTag,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: tagName,
							organizationId: orgId,
						},
					},
				},
			);

			assertToBeNonNullish(createFirstTagResult.data?.createTag?.id);

			// Try to create a second tag with the same name
			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: tagName,
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createTag).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "name"],
									message: "This name is not available.",
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createTag"],
					}),
				]),
			);
		});
	});

	suite("Successful Creation", () => {
		test("Creates tag successfully without folderId", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const tagName = `Test Tag ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: tagName,
						organizationId: orgId,
					},
				},
			});

			assertToBeNonNullish(result.data?.createTag);
			expect(result.data.createTag).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: tagName,
					createdAt: expect.any(String),
				}),
			);
			expect(result.errors).toBeUndefined();
		});

		test("Creates tag successfully with folderId", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			// Create a folder first
			const createFolderResult = await mercuriusClient.mutate(
				Mutation_createTagFolder,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: `Test Folder ${faker.string.uuid()}`,
							organizationId: orgId,
						},
					},
				},
			);

			assertToBeNonNullish(createFolderResult.data?.createTagFolder);
			const folderId = createFolderResult.data.createTagFolder.id;

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const tagName = `Tag with Folder ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_createTag, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: tagName,
						organizationId: orgId,
						folderId: folderId,
					},
				},
			});

			assertToBeNonNullish(result.data?.createTag);
			expect(result.data.createTag).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: tagName,
					createdAt: expect.any(String),
				}),
			);
			expect(result.errors).toBeUndefined();
		});
	});

	suite("Edge cases and race conditions", () => {
		test("Returns unexpected error when insert returns empty array", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			// NOTE: Test Isolation Consideration
			// This test mocks server.drizzleClient.insert which is a shared resource.
			// The finally block ensures the original method is restored even if the test fails.
			// Vitest runs tests within the same file sequentially by default (sequence.concurrent: false
			// in vitest.config.ts), so this mock won't interfere with other tests in this file.
			// For cross-file isolation, Vitest's test isolation (isolate: true) ensures each test file
			// runs in a separate worker thread with its own module context.
			// Store original insert method
			const originalInsert = server.drizzleClient.insert;

			// Mock the insert to return an empty array (simulating an unexpected database behavior)
			const mockInsert = vi.fn().mockImplementation(() => ({
				values: () => ({
					returning: async () => [],
				}),
			}));

			server.drizzleClient.insert =
				mockInsert as unknown as typeof server.drizzleClient.insert;

			try {
				const result = await mercuriusClient.mutate(Mutation_createTag, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: "Test Tag",
							organizationId: orgId,
						},
					},
				});

				expect(result.data?.createTag ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
						}),
					]),
				);
			} finally {
				server.drizzleClient.insert = originalInsert;
			}
		});
	});
});
