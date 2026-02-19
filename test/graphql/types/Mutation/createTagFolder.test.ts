import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";

import { usersTable } from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createTagFolder,
	Mutation_deleteOrganization,
	Mutation_deleteTagFolder,
	Query_currentUser,
} from "../documentNodes";

let cachedAdminAuth: {
	token: string;
	userId: string;
} | null = null;

async function getAdminAuth() {
	if (cachedAdminAuth !== null) return cachedAdminAuth;
	const { accessToken } = await getAdminAuthViaRest(server);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${accessToken}` },
	});
	const userId = currentUserResult.data?.currentUser?.id;
	assertToBeNonNullish(accessToken);
	assertToBeNonNullish(userId);
	cachedAdminAuth = { token: accessToken, userId };
	return cachedAdminAuth;
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

suite("Mutation field createTagFolder", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const cleanup of testCleanupFunctions.reverse()) {
			try {
				await cleanup();
			} catch (e) {
				console.error(e);
			}
		}
		testCleanupFunctions.length = 0;
	});

	suite("Authentication and Authorization", () => {
		test("Returns an error if the client is not authenticated", async () => {
			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
				variables: {
					input: {
						name: "Test Folder",
						organizationId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createTagFolder).toEqual(null);

			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["createTagFolder"],
					}),
				]),
			);
		});

		test("Returns an error if the user is present in the token but not in the database", async () => {
			const regularUser = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId));

			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						name: "Test Folder",
						organizationId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createTagFolder).toEqual(null);

			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["createTagFolder"],
					}),
				]),
			);
		});

		test("Returns an error when a non-member regular user tries to create a folder", async () => {
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

			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						name: "Test Folder",
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createTagFolder).toEqual(null);
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
						path: ["createTagFolder"],
					}),
				]),
			);
		});

		test("Returns an error when an organization member without admin rights tries to create a folder", async () => {
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

			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						name: "Test Folder",
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createTagFolder).toEqual(null);
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
						path: ["createTagFolder"],
					}),
				]),
			);
		});

		test("Allows system administrator to create tag folder", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const folderName = `System Admin Folder ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: folderName,
						organizationId: orgId,
					},
				},
			});

			assertToBeNonNullish(result.data?.createTagFolder);
			expect(result.data.createTagFolder.name).toEqual(folderName);
			expect(result.errors).toBeUndefined();
		});

		test("Allows organization administrator to create tag folder", async () => {
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

			const folderName = `Org Admin Folder ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
				headers: {
					authorization: `bearer ${orgAdmin.authToken}`,
				},
				variables: {
					input: {
						name: folderName,
						organizationId: orgId,
					},
				},
			});

			assertToBeNonNullish(result.data?.createTagFolder);
			expect(result.data.createTagFolder.name).toEqual(folderName);
			expect(result.errors).toBeUndefined();
		});
	});

	suite("Input Validation", () => {
		test("Returns an error when invalid arguments are provided", async () => {
			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
				variables: {
					input: {
						name: 123 as unknown as string,
						organizationId: "not-a-uuid",
					},
				},
			});

			expect(result.data?.createTagFolder ?? null).toEqual(null);

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

			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
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

			expect(result.data?.createTagFolder).toEqual(null);
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
						path: ["createTagFolder"],
					}),
				]),
			);
		});

		test("Returns invalid_arguments error when name exceeds 256 characters", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
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

			expect(result.data?.createTagFolder).toEqual(null);
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
						path: ["createTagFolder"],
					}),
				]),
			);
		});
	});

	suite("Resource Existence", () => {
		test("Returns an error when organization does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "Test Folder",
						organizationId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createTagFolder).toEqual(null);
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
						path: ["createTagFolder"],
					}),
				]),
			);
		});

		test("Returns an error when parent folder does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "Test Folder",
						organizationId: orgId,
						parentFolderId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.createTagFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "parentFolderId"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createTagFolder"],
					}),
				]),
			);
		});

		test("Returns an error when parent folder belongs to different organization", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			// Create two organizations
			const orgId1 = await createOrganization(adminAuthToken);
			const orgId2 = await createOrganization(adminAuthToken);

			// Create a folder in org1
			const createParentFolderResult = await mercuriusClient.mutate(
				Mutation_createTagFolder,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: "Parent Folder in Org1",
							organizationId: orgId1,
						},
					},
				},
			);

			assertToBeNonNullish(createParentFolderResult.data?.createTagFolder);
			const parentFolderId = createParentFolderResult.data.createTagFolder.id;

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: parentFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId1 } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId2 } },
				});
			});

			// Try to create a folder in org2 with parent from org1
			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: "Child Folder",
						organizationId: orgId2,
						parentFolderId: parentFolderId,
					},
				},
			});

			expect(result.data?.createTagFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "parentFolderId"],
									message:
										"This tag folder does not belong to the associated organization.",
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createTagFolder"],
					}),
				]),
			);
		});
	});

	suite("Successful Creation", () => {
		test("Creates tag folder successfully without parent folder", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const folderName = `Test Folder ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: folderName,
						organizationId: orgId,
					},
				},
			});

			assertToBeNonNullish(result.data?.createTagFolder);
			expect(result.data.createTagFolder).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: folderName,
					createdAt: expect.any(String),
				}),
			);
			expect(result.errors).toBeUndefined();
		});

		test("Creates tag folder successfully with parent folder", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			// Create parent folder first
			const parentFolderName = `Parent Folder ${faker.string.uuid()}`;
			const createParentResult = await mercuriusClient.mutate(
				Mutation_createTagFolder,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: parentFolderName,
							organizationId: orgId,
						},
					},
				},
			);

			assertToBeNonNullish(createParentResult.data?.createTagFolder);
			const parentFolderId = createParentResult.data.createTagFolder.id;

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			// Create child folder with parent
			const childFolderName = `Child Folder ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: childFolderName,
						organizationId: orgId,
						parentFolderId: parentFolderId,
					},
				},
			});

			assertToBeNonNullish(result.data?.createTagFolder);
			expect(result.data.createTagFolder).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: childFolderName,
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
				const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							name: "Test Folder",
							organizationId: orgId,
						},
					},
				});

				expect(result.data?.createTagFolder ?? null).toBeNull();
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
