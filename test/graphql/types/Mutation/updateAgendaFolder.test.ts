import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { afterEach, expect, suite, test, vi } from "vitest";

import {
	eventsTable,
	organizationMembershipsTable,
	organizationsTable,
	usersTable,
} from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createAgendaFolder,
	Mutation_updateAgendaFolder,
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

// Helper function to create an organization and event using direct database operations
async function createOrganizationAndEvent(adminUserId: string) {
	const organizationId = uuidv7();
	const eventId = uuidv7();

	// Create organization directly in database
	await server.drizzleClient.insert(organizationsTable).values({
		id: organizationId,
		name: `Org ${faker.string.uuid()}`,
		countryCode: "us",
		creatorId: adminUserId,
	});

	// Create organization membership directly in database
	await server.drizzleClient.insert(organizationMembershipsTable).values({
		memberId: adminUserId,
		organizationId: organizationId,
		role: "administrator",
		creatorId: adminUserId,
	});

	// Create event directly in database
	const startAt = new Date();
	const endAt = new Date(Date.now() + 60 * 60 * 1000);

	await server.drizzleClient.insert(eventsTable).values({
		id: eventId,
		name: `Event ${faker.string.uuid()}`,
		organizationId: organizationId,
		creatorId: adminUserId,
		startAt: startAt,
		endAt: endAt,
		description: "Agenda folder test event",
	});

	return {
		organizationId,
		eventId,
		cleanup: async () => {
			// Delete in reverse order of creation to handle foreign keys
			await server.drizzleClient
				.delete(eventsTable)
				.where(eq(eventsTable.id, eventId));

			await server.drizzleClient
				.delete(organizationMembershipsTable)
				.where(eq(organizationMembershipsTable.organizationId, organizationId));

			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, organizationId));
		},
	};
}

// Helper function to add organization membership using direct database operations
async function addOrganizationMembership(params: {
	memberId: string;
	organizationId: string;
	role: "administrator" | "regular";
	creatorId: string;
}) {
	await server.drizzleClient.insert(organizationMembershipsTable).values({
		memberId: params.memberId,
		organizationId: params.organizationId,
		role: params.role,
		creatorId: params.creatorId,
	});
}

// Helper function to create an agenda folder
async function createAgendaFolder(
	adminAuthToken: string,
	eventId: string,
	options?: {
		name?: string;
		isAgendaItemFolder?: boolean;
		parentFolderId?: string;
	},
): Promise<string> {
	const createFolderResult = await mercuriusClient.mutate(
		Mutation_createAgendaFolder,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					name: options?.name ?? `Folder ${faker.string.uuid()}`,
					eventId,
					isAgendaItemFolder: options?.isAgendaItemFolder ?? false,
					parentFolderId: options?.parentFolderId,
				},
			},
		},
	);

	assertToBeNonNullish(createFolderResult.data?.createAgendaFolder?.id);
	return createFolderResult.data.createAgendaFolder.id;
}

// Helper function to get admin user id
async function getAdminUserId(): Promise<string> {
	if (cachedAdminAuth?.userId) {
		return cachedAdminAuth.userId;
	}
	const auth = await getAdminAuth();
	return auth.userId;
}

suite("Mutation field updateAgendaFolder", () => {
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
			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const folderId = await createAgendaFolder(adminAuthToken, eventId);

			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				// No authorization header
				variables: {
					input: {
						id: folderId,
						name: "Updated Name",
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});

		test("Returns unauthenticated error when user is deleted after authentication", async () => {
			const regularUser = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId));

			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
						name: "Updated Name",
					},
				},
			});

			expect(result.data.updateAgendaFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});

		test("Returns unauthorized error when non-member tries to update folder", async () => {
			const [{ token: adminAuthToken }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const folderId = await createAgendaFolder(adminAuthToken, eventId);

			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: folderId,
						name: "Updated Name",
					},
				},
			});

			expect(result.data.updateAgendaFolder).toEqual(null);
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
					}),
				]),
			);
		});

		test("Returns unauthorized error when regular member tries to update folder", async () => {
			const [{ token: adminAuthToken }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, eventId, organizationId } =
				await createOrganizationAndEvent(await getAdminUserId());
			testCleanupFunctions.push(cleanup);

			// Add regular user as regular member
			await addOrganizationMembership({
				memberId: regularUser.userId,
				organizationId,
				role: "regular",
				creatorId: await getAdminUserId(),
			});

			const folderId = await createAgendaFolder(adminAuthToken, eventId);

			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: folderId,
						name: "Updated Name",
					},
				},
			});

			expect(result.data.updateAgendaFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
					}),
				]),
			);
		});

		test("Allows system administrator to update folder", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const folderId = await createAgendaFolder(adminAuthToken, eventId, {
				name: "Original Name",
			});

			const newName = `Updated ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: folderId,
						name: newName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAgendaFolder?.name).toBe(newName);
		});

		test("Allows organization administrator to update folder", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const orgAdmin = await createRegularUserUsingAdmin();

			const { cleanup, eventId, organizationId } =
				await createOrganizationAndEvent(await getAdminUserId());
			testCleanupFunctions.push(cleanup);

			// Add user as organization admin
			await addOrganizationMembership({
				memberId: orgAdmin.userId,
				organizationId,
				role: "administrator",
				creatorId: await getAdminUserId(),
			});

			const folderId = await createAgendaFolder(adminAuthToken, eventId, {
				name: "Original Name",
			});

			const newName = `Updated ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${orgAdmin.authToken}` },
				variables: {
					input: {
						id: folderId,
						name: newName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAgendaFolder?.name).toBe(newName);
		});
	});

	suite("Input Validation", () => {
		test("Returns invalid_arguments error for invalid UUID in id field", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: "invalid-uuid",
						name: "Updated Name",
					},
				},
			});

			expect(result.data?.updateAgendaFolder ?? null).toEqual(null);
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

		test("Returns invalid_arguments error for invalid UUID in parentFolderId field", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const folderId = await createAgendaFolder(adminAuthToken, eventId);

			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: folderId,
						parentFolderId: "invalid-uuid",
					},
				},
			});

			expect(result.data?.updateAgendaFolder ?? null).toEqual(null);
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

		test("Returns invalid_arguments error when no optional argument is provided", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const folderId = await createAgendaFolder(adminAuthToken, eventId);

			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: folderId,
						// No name or parentFolderId provided
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
		});
	});

	suite("Resource Existence", () => {
		test("Returns arguments_associated_resources_not_found when agenda folder does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const nonExistentId = faker.string.uuid();

			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
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
			expect(result.errors?.[0]?.extensions?.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						argumentPath: ["input", "id"],
					}),
				]),
			);
		});

		test("Returns arguments_associated_resources_not_found when parent folder does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const folderId = await createAgendaFolder(adminAuthToken, eventId);
			const nonExistentParentId = faker.string.uuid();

			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: folderId,
						parentFolderId: nonExistentParentId,
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
			expect(result.errors?.[0]?.extensions?.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						argumentPath: ["input", "parentFolderId"],
					}),
				]),
			);
		});
	});

	suite("Parent Folder Validation", () => {
		test("Returns forbidden_action error when parent folder belongs to different event", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const adminUserId = await getAdminUserId();

			// Create two organizations with events
			const { cleanup: cleanup1, eventId: eventId1 } =
				await createOrganizationAndEvent(adminUserId);
			testCleanupFunctions.push(cleanup1);

			const { cleanup: cleanup2, eventId: eventId2 } =
				await createOrganizationAndEvent(adminUserId);
			testCleanupFunctions.push(cleanup2);

			// Create folders in each event
			const folderId1 = await createAgendaFolder(adminAuthToken, eventId1);
			const folderId2 = await createAgendaFolder(adminAuthToken, eventId2);

			// Try to set folder from event2 as parent of folder in event1
			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: folderId1,
						parentFolderId: folderId2,
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"forbidden_action_on_arguments_associated_resources",
			);
			expect(result.errors?.[0]?.extensions?.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						argumentPath: ["input", "parentFolderId"],
						message:
							"This agenda folder does not belong to the event associated to the agenda folder being updated.",
					}),
				]),
			);
		});

		test("Returns forbidden_action error when parent folder is an agenda item folder", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			// Create agenda item folder (cannot have children)
			const agendaItemFolderId = await createAgendaFolder(
				adminAuthToken,
				eventId,
				{
					name: "Agenda Item Folder",
					isAgendaItemFolder: true,
				},
			);

			// Create regular folder
			const regularFolderId = await createAgendaFolder(
				adminAuthToken,
				eventId,
				{
					name: "Regular Folder",
					isAgendaItemFolder: false,
				},
			);

			// Try to set agenda item folder as parent
			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: regularFolderId,
						parentFolderId: agendaItemFolderId,
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"forbidden_action_on_arguments_associated_resources",
			);
			expect(result.errors?.[0]?.extensions?.issues).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						argumentPath: ["input", "parentFolderId"],
						message:
							"This agenda folder cannot be a parent folder for other agenda folders.",
					}),
				]),
			);
		});
	});

	suite("Successful Updates", () => {
		test("Successfully updates folder name", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const folderId = await createAgendaFolder(adminAuthToken, eventId, {
				name: "Original Name",
			});

			const newName = `Updated ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: folderId,
						name: newName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAgendaFolder).toEqual(
				expect.objectContaining({
					id: folderId,
					name: newName,
				}),
			);
		});

		test("Successfully updates parent folder", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			// Create parent folder (non-agenda-item folder)
			const parentFolderId = await createAgendaFolder(adminAuthToken, eventId, {
				name: "Parent Folder",
				isAgendaItemFolder: false,
			});

			// Create child folder
			const childFolderId = await createAgendaFolder(adminAuthToken, eventId, {
				name: "Child Folder",
				isAgendaItemFolder: false,
			});

			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: childFolderId,
						parentFolderId: parentFolderId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAgendaFolder?.id).toBe(childFolderId);
		});

		test("Successfully updates both name and parent folder", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const parentFolderId = await createAgendaFolder(adminAuthToken, eventId, {
				name: "Parent Folder",
				isAgendaItemFolder: false,
			});

			const childFolderId = await createAgendaFolder(adminAuthToken, eventId, {
				name: "Original Child Name",
				isAgendaItemFolder: false,
			});

			const newName = `Updated Child ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
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
			expect(result.data?.updateAgendaFolder).toEqual(
				expect.objectContaining({
					id: childFolderId,
					name: newName,
				}),
			);
		});
	});

	suite("Edge Cases and Race Conditions", () => {
		test("Returns unexpected error when folder is deleted during update operation", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const folderId = await createAgendaFolder(adminAuthToken, eventId);

			// Store original update method
			const originalUpdate = server.drizzleClient.update;

			// Mock the update to return an empty array (simulating the folder being deleted)
			const mockUpdate = vi.fn().mockImplementation(() => ({
				set: () => ({
					where: () => ({
						returning: async () => [],
					}),
				}),
			}));

			server.drizzleClient.update =
				mockUpdate as unknown as typeof server.drizzleClient.update;

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateAgendaFolder,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								id: folderId,
								name: "Updated Name",
							},
						},
					},
				);

				expect(result.data?.updateAgendaFolder ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
						}),
					]),
				);

				expect(mockUpdate).toHaveBeenCalled();
			} finally {
				server.drizzleClient.update = originalUpdate;
			}
		});

		test("Handles unicode characters in folder name", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const folderId = await createAgendaFolder(adminAuthToken, eventId);

			const unicodeName = "文件夹名称 📁 Папка";
			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: folderId,
						name: unicodeName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAgendaFolder?.name).toBe(unicodeName);
		});

		test("Handles maximum length folder name (256 characters)", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const folderId = await createAgendaFolder(adminAuthToken, eventId);

			const maxLengthName = "a".repeat(256);
			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: folderId,
						name: maxLengthName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAgendaFolder?.name).toBe(maxLengthName);
		});

		test("Rejects folder name exceeding maximum length (257 characters)", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const { cleanup, eventId } = await createOrganizationAndEvent(
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const folderId = await createAgendaFolder(adminAuthToken, eventId);

			const overLimitName = "a".repeat(257);
			const result = await mercuriusClient.mutate(Mutation_updateAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: folderId,
						name: overLimitName,
					},
				},
			});

			expect(result.data?.updateAgendaFolder ?? null).toEqual(null);
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
		});
	});
});
