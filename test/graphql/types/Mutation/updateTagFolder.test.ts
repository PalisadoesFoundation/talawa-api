import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createTagFolder,
	Mutation_deleteOrganization,
	Mutation_deleteTagFolder,
	Mutation_updateTagFolder,
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

	const adminSignInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);
	assertToBeNonNullish(adminSignInResult.data.signIn?.user?.id);

	cachedAdminAuth = {
		token: adminSignInResult.data.signIn.authenticationToken,
		userId: adminSignInResult.data.signIn.user.id,
	};

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

	assertToBeNonNullish(createOrgResult.data?.createOrganization?.id);
	return createOrgResult.data.createOrganization.id;
}

// Helper function to create a tag folder
async function createTagFolder(
	adminAuthToken: string,
	organizationId: string,
	name?: string,
	parentFolderId?: string,
): Promise<string> {
	const createTagFolderResult = await mercuriusClient.mutate(
		Mutation_createTagFolder,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					name: name ?? `TagFolder ${faker.string.uuid()}`,
					organizationId,
					parentFolderId,
				},
			},
		},
	);

	assertToBeNonNullish(createTagFolderResult.data?.createTagFolder?.id);
	return createTagFolderResult.data.createTagFolder.id;
}

// Helper function to add organization membership
async function addOrganizationMembership(params: {
	adminAuthToken: string;
	memberId: string;
	organizationId: string;
	role: "administrator" | "regular";
}) {
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${params.adminAuthToken}` },
		variables: {
			input: {
				memberId: params.memberId,
				organizationId: params.organizationId,
				role: params.role,
			},
		},
	});
}

suite("Mutation field updateTagFolder", () => {
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
		test("Returns unauthenticated error when client is not authenticated", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const tagFolderId = await createTagFolder(adminAuthToken, orgId);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				// No authorization header
				variables: {
					input: {
						id: tagFolderId,
						name: "Updated Name",
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});

		test("Returns unauthorized error when regular user tries to update tag folder", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const tagFolderId = await createTagFolder(adminAuthToken, orgId);

			// Create a regular user and get their token
			const regularUser = await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUser.authToken);

			// Add the regular user as a regular member of the organization
			await addOrganizationMembership({
				adminAuthToken,
				memberId: regularUser.userId,
				organizationId: orgId,
				role: "regular",
			});

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						id: tagFolderId,
						name: "Updated Name",
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
		});

		test("Allows organization administrator to update tag folder", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const tagFolderId = await createTagFolder(adminAuthToken, orgId);

			// Create a regular user and make them org admin
			const orgAdmin = await createRegularUserUsingAdmin();
			assertToBeNonNullish(orgAdmin.authToken);

			await addOrganizationMembership({
				adminAuthToken,
				memberId: orgAdmin.userId,
				organizationId: orgId,
				role: "administrator",
			});

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const newName = `Updated ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${orgAdmin.authToken}` },
				variables: {
					input: {
						id: tagFolderId,
						name: newName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateTagFolder?.name).toBe(newName);
		});
	});

	suite("Validation", () => {
		test("Returns invalid_arguments error for invalid UUID in id field", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: "invalid-uuid",
						name: "Updated Name",
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
		});

		test("Returns invalid_arguments error for invalid UUID in parentFolderId field", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const tagFolderId = await createTagFolder(adminAuthToken, orgId);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: tagFolderId,
						parentFolderId: "invalid-uuid",
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
		});

		test("Returns invalid_arguments error when no optional argument is provided", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const tagFolderId = await createTagFolder(adminAuthToken, orgId);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: tagFolderId,
						// No name or parentFolderId provided
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
		});
	});

	suite("Resource not found", () => {
		test("Returns arguments_associated_resources_not_found error when tag folder does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const nonExistentId = faker.string.uuid();

			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: nonExistentId,
						name: "Updated Name",
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		});

		test("Returns arguments_associated_resources_not_found error when parent folder does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const tagFolderId = await createTagFolder(adminAuthToken, orgId);
			const nonExistentParentId = faker.string.uuid();

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: tagFolderId,
						parentFolderId: nonExistentParentId,
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		});
	});

	suite("Forbidden action", () => {
		test("Returns forbidden_action error when parent folder belongs to different organization", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			// Create two organizations
			const orgId1 = await createOrganization(adminAuthToken);
			const orgId2 = await createOrganization(adminAuthToken);

			// Create tag folders in each organization
			const tagFolderId1 = await createTagFolder(adminAuthToken, orgId1);
			const tagFolderId2 = await createTagFolder(adminAuthToken, orgId2);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId1 } },
				});
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId2 } },
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

			// Try to set tagFolderId2 (from org2) as parent of tagFolderId1 (from org1)
			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: tagFolderId1,
						parentFolderId: tagFolderId2,
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"forbidden_action_on_arguments_associated_resources",
			);
		});
	});

	suite("Successful updates", () => {
		test("Successfully updates tag folder name as system administrator", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const tagFolderId = await createTagFolder(
				adminAuthToken,
				orgId,
				"Original Name",
			);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const newName = `Updated ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: tagFolderId,
						name: newName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateTagFolder).toEqual(
				expect.objectContaining({
					id: tagFolderId,
					name: newName,
				}),
			);
		});

		test("Successfully updates tag folder parentFolderId", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			// Create parent folder and child folder
			const parentFolderId = await createTagFolder(
				adminAuthToken,
				orgId,
				"Parent Folder",
			);
			const childFolderId = await createTagFolder(
				adminAuthToken,
				orgId,
				"Child Folder",
			);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: childFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: parentFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: childFolderId,
						parentFolderId: parentFolderId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateTagFolder?.id).toBe(childFolderId);
		});

		test("Successfully updates both name and parentFolderId", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			const parentFolderId = await createTagFolder(
				adminAuthToken,
				orgId,
				"Parent Folder",
			);
			const childFolderId = await createTagFolder(
				adminAuthToken,
				orgId,
				"Original Child Name",
			);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: childFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: parentFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const newName = `Updated Child ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: childFolderId,
						name: newName,
						parentFolderId: parentFolderId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateTagFolder).toEqual(
				expect.objectContaining({
					id: childFolderId,
					name: newName,
				}),
			);
		});

		test("Successfully removes parent folder by setting parentFolderId to null", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);

			const parentFolderId = await createTagFolder(
				adminAuthToken,
				orgId,
				"Parent Folder",
			);
			// Create child folder with parent
			const childFolderId = await createTagFolder(
				adminAuthToken,
				orgId,
				"Child Folder",
				parentFolderId,
			);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: childFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: parentFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			// Update to remove parent by setting it to null
			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: childFolderId,
						name: "Updated Name Without Parent",
						parentFolderId: null,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateTagFolder?.id).toBe(childFolderId);
		});
	});

	suite("Edge cases", () => {
		test("Handles special characters in folder name", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const tagFolderId = await createTagFolder(adminAuthToken, orgId);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const specialName = 'Folder with <special> & "characters"';
			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: tagFolderId,
						name: specialName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			// Note: The name may be HTML-escaped when returned
			expect(result.data?.updateTagFolder?.id).toBe(tagFolderId);
		});

		test("Handles unicode characters in folder name", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const tagFolderId = await createTagFolder(adminAuthToken, orgId);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const unicodeName = "文件夹名称 📁 Папка";
			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: tagFolderId,
						name: unicodeName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateTagFolder?.name).toBe(unicodeName);
		});

		test("Handles maximum length folder name (256 characters)", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const tagFolderId = await createTagFolder(adminAuthToken, orgId);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const maxLengthName = "a".repeat(256);
			const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: tagFolderId,
						name: maxLengthName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateTagFolder?.name).toBe(maxLengthName);
		});
	});

	suite("Race conditions and unexpected errors", () => {
		test("Returns unauthenticated error when current user is not found in database (deleted after authentication)", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const tagFolderId = await createTagFolder(adminAuthToken, orgId);

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: tagFolderId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			// Store original query
			const originalQuery = server.drizzleClient.query;

			// Mock the query to return undefined for usersTable but still work for tagFoldersTable
			const mockFindFirst = vi.fn().mockResolvedValue(undefined);
			const mockQuery = {
				...originalQuery,
				usersTable: {
					findFirst: mockFindFirst,
				},
				tagFoldersTable: originalQuery.tagFoldersTable,
			};

			server.drizzleClient.query =
				mockQuery as unknown as typeof server.drizzleClient.query;

			try {
				const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: tagFolderId,
							name: "Updated Name",
						},
					},
				});

				expect(result.data?.updateTagFolder ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthenticated",
							}),
						}),
					]),
				);

				// Verify that the mocked usersTable.findFirst was actually called
				expect(mockFindFirst).toHaveBeenCalled();
			} finally {
				server.drizzleClient.query = originalQuery;
			}
		});

		test("Returns unexpected error when tag folder is deleted during update operation", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgId = await createOrganization(adminAuthToken);
			const tagFolderId = await createTagFolder(adminAuthToken, orgId);

			testCleanupFunctions.push(async () => {
				// Tag folder may have been deleted by the mock, so cleanup may fail
				try {
					await mercuriusClient.mutate(Mutation_deleteTagFolder, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: { input: { id: tagFolderId } },
					});
				} catch {
					// Ignore cleanup error
				}
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			});

			// Store original update method
			const originalUpdate = server.drizzleClient.update;

			// Mock the update to return an empty array (simulating the tag folder being deleted)
			const mockUpdate = vi.fn().mockImplementation(() => ({
				set: () => ({
					where: () => ({
						returning: async () => [],
					}),
				}),
			}));
			server.drizzleClient.update =
				mockUpdate as typeof server.drizzleClient.update;

			try {
				const result = await mercuriusClient.mutate(Mutation_updateTagFolder, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: tagFolderId,
							name: "Updated Name",
						},
					},
				});

				expect(result.data?.updateTagFolder ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
						}),
					]),
				);

				// Verify that the mocked drizzleClient.update was actually called
				expect(mockUpdate).toHaveBeenCalled();
			} finally {
				server.drizzleClient.update = originalUpdate;
			}
		});
	});
});
