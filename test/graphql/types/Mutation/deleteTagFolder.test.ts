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

// Helper function to create a tag folder
async function createTagFolder(params: {
	authToken: string;
	organizationId: string;
	name: string;
}): Promise<string> {
	const result = await mercuriusClient.mutate(Mutation_createTagFolder, {
		headers: { authorization: `bearer ${params.authToken}` },
		variables: {
			input: {
				name: params.name,
				organizationId: params.organizationId,
			},
		},
	});

	if (result.errors) {
		throw new Error(
			`Tag folder creation failed: ${JSON.stringify(result.errors)}`,
		);
	}

	assertToBeNonNullish(result.data?.createTagFolder?.id);
	return result.data.createTagFolder.id;
}

suite("Mutation field deleteTagFolder", () => {
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
			const result = await mercuriusClient.mutate(Mutation_deleteTagFolder, {
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.deleteTagFolder).toEqual(null);

			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["deleteTagFolder"],
					}),
				]),
			);
		});

		test("Returns an error if the user is present in the token but not in the database", async () => {
			const regularUser = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId));

			const result = await mercuriusClient.mutate(Mutation_deleteTagFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.deleteTagFolder).toEqual(null);

			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["deleteTagFolder"],
					}),
				]),
			);
		});

		test("Returns an error when a non-member regular user tries to delete a folder", async () => {
			const [{ token: adminAuthToken }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const orgId = await createOrganization(adminAuthToken);
			const folderId = await createTagFolder({
				authToken: adminAuthToken,
				organizationId: orgId,
				name: `Test Folder ${faker.string.uuid()}`,
			});

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_deleteTagFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: folderId,
					},
				},
			});

			expect(result.data?.deleteTagFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["deleteTagFolder"],
					}),
				]),
			);
		});

		test("Returns an error when an organization member without admin rights tries to delete a folder", async () => {
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

			const folderId = await createTagFolder({
				authToken: adminAuthToken,
				organizationId: orgId,
				name: `Test Folder ${faker.string.uuid()}`,
			});

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_deleteTagFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: folderId,
					},
				},
			});

			expect(result.data?.deleteTagFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["deleteTagFolder"],
					}),
				]),
			);
		});

		test("Allows system administrator to delete tag folder", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const folderName = `System Admin Folder ${faker.string.uuid()}`;
			const folderId = await createTagFolder({
				authToken: adminAuthToken,
				organizationId: orgId,
				name: folderName,
			});

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_deleteTagFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: folderId,
					},
				},
			});

			assertToBeNonNullish(result.data?.deleteTagFolder);
			expect(result.data.deleteTagFolder.id).toEqual(folderId);
			expect(result.data.deleteTagFolder.name).toEqual(folderName);
			expect(result.errors).toBeUndefined();
		});

		test("Allows organization administrator to delete tag folder", async () => {
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

			const folderName = `Org Admin Folder ${faker.string.uuid()}`;
			const folderId = await createTagFolder({
				authToken: orgAdmin.authToken,
				organizationId: orgId,
				name: folderName,
			});

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_deleteTagFolder, {
				headers: {
					authorization: `bearer ${orgAdmin.authToken}`,
				},
				variables: {
					input: {
						id: folderId,
					},
				},
			});

			assertToBeNonNullish(result.data?.deleteTagFolder);
			expect(result.data.deleteTagFolder.id).toEqual(folderId);
			expect(result.data.deleteTagFolder.name).toEqual(folderName);
			expect(result.errors).toBeUndefined();
		});
	});

	suite("Input Validation", () => {
		test("Returns an error when invalid arguments are provided", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_deleteTagFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: "not-a-uuid",
					},
				},
			});

			expect(result.data?.deleteTagFolder ?? null).toEqual(null);
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);

			// Check that we got either an invalid_arguments error or a GraphQL validation error
			const hasValidationError = result.errors?.some(
				(error) =>
					error.extensions?.code === "invalid_arguments" ||
					error.message.includes("got invalid value") ||
					error.message.includes("ID cannot represent") ||
					error.message.includes("Expected ID"),
			);
			expect(hasValidationError).toBe(true);
		});
	});

	suite("Resource Existence", () => {
		test("Returns an error when tag folder does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_deleteTagFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.deleteTagFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["deleteTagFolder"],
					}),
				]),
			);
		});
	});

	suite("Edge cases and race conditions", () => {
		test("Returns unexpected error when delete returns empty array", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const folderId = await createTagFolder({
				authToken: adminAuthToken,
				organizationId: orgId,
				name: `Test Folder ${faker.string.uuid()}`,
			});

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			// Store original delete method
			const originalDelete = server.drizzleClient.delete;

			// Mock the delete to return an empty array (simulating an unexpected database behavior)
			const mockDelete = vi.fn().mockImplementation(() => ({
				where: () => ({
					returning: async () => [],
				}),
			}));

			server.drizzleClient.delete =
				mockDelete as unknown as typeof server.drizzleClient.delete;

			try {
				const result = await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: folderId,
						},
					},
				});

				expect(result.data?.deleteTagFolder ?? null).toBeNull();
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
				server.drizzleClient.delete = originalDelete;
			}
		});
	});
});
