import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { initGraphQLTada } from "gql.tada";
import { afterEach, expect, suite, test } from "vitest";
import { usersTable } from "~/src/drizzle/schema";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createAgendaFolder,
	Mutation_createAgendaItem,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// Test-specific mutation that includes key field in selection set
const Mutation_createAgendaItemWithKey = gql(`
  mutation Mutation_createAgendaItemWithKey($input: MutationCreateAgendaItemInput!) {
    createAgendaItem(input: $input) {
      id
      name
      key
      type
    }
  }
`);

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

async function getAdminUserId(): Promise<string> {
	if (cachedAdminAuth?.userId) {
		return cachedAdminAuth.userId;
	}
	const auth = await getAdminAuth();
	return auth.userId;
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
			`Failed to create organization membership: ${result.errors[0]?.message || "Unknown error"}`,
		);
	}
}

// Helper function to create organization, event, and agenda folder for testing
async function createTestEnvironment(
	adminAuthToken: string,
	adminUserId: string,
) {
	// Create organization
	const createOrganizationResult = await mercuriusClient.mutate(
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
	assertToBeNonNullish(createOrganizationResult.data?.createOrganization);
	const organizationId = createOrganizationResult.data.createOrganization.id;

	// Add admin as organization member
	await addOrganizationMembership({
		adminAuthToken,
		memberId: adminUserId,
		organizationId,
		role: "administrator",
	});

	// Create event
	const createEventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: `Event ${faker.string.uuid()}`,
				organizationId,
				startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
				endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
				description: "Agenda item test event",
			},
		},
	});
	assertToBeNonNullish(createEventResult.data?.createEvent);
	const eventId = createEventResult.data.createEvent.id;

	// Create agenda folder (must be isAgendaItemFolder: true for agenda items)
	const createFolderResult = await mercuriusClient.mutate(
		Mutation_createAgendaFolder,
		{
			headers: { authorization: `bearer ${adminAuthToken}` },
			variables: {
				input: {
					name: "Test Agenda Folder",
					eventId,
					description: "desc",
					sequence: 1,
					organizationId: "org-id"
				},
			},
		},
	);
	assertToBeNonNullish(createFolderResult.data?.createAgendaFolder);
	const folderId = createFolderResult.data.createAgendaFolder.id;

	return {
		organizationId,
		eventId,
		folderId,
		cleanup: async () => {
			await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: eventId } },
			});
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organizationId } },
			});
		},
	};
}

// Helper function to create a non-agenda-item folder (for forbidden action test)
async function createNonAgendaItemFolder(
	adminAuthToken: string,
	eventId: string,
) {
	const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: "Non-Item Folder",
				eventId,
				description: "desc",
				sequence: 1,
				organizationId: "org-id"
			},
		},
	});
	assertToBeNonNullish(result.data?.createAgendaFolder);
	return result.data.createAgendaFolder.id;
}

suite("Mutation field createAgendaItem", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const cleanup of testCleanupFunctions.reverse()) {
			try {
				await cleanup();
			} catch (error) {
				console.error("Cleanup failed:", error);
			}
		}
		testCleanupFunctions.length = 0;
	});

	suite("Authentication and Authorization", () => {
		test("Returns an error if the client is not authenticated", async () => {
			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				variables: {
					input: {
						folderId: faker.string.uuid(),
						name: "Test Agenda Item",
						type: "general",
					},
				},
			});

			expect(result.data?.createAgendaItem).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["createAgendaItem"],
					}),
				]),
			);
		});

		test("Returns an error if the user exists in token but not in database", async () => {
			const regularUser = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId));

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						folderId: faker.string.uuid(),
						name: "Test Agenda Item",
						type: "general",
					},
				},
			});

			expect(result.data?.createAgendaItem).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["createAgendaItem"],
					}),
				]),
			);
		});

		test("Returns an error when a non-member user tries to create an agenda item", async () => {
			const [{ token: adminAuthToken }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						folderId,
						name: "Test Agenda Item",
						type: "general",
					},
				},
			});

			expect(result.data?.createAgendaItem).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						message: expect.any(String),
						path: ["createAgendaItem"],
					}),
				]),
			);
		});

		test("Returns an error when a regular organization member tries to create an agenda item", async () => {
			const [{ token: adminAuthToken }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, folderId, organizationId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			// Add regular user as a regular member (not admin)
			await addOrganizationMembership({
				adminAuthToken,
				memberId: regularUser.userId,
				organizationId,
				role: "regular",
			});

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						folderId,
						name: "Test Agenda Item",
						type: "general",
					},
				},
			});

			expect(result.data?.createAgendaItem).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						message: expect.any(String),
						path: ["createAgendaItem"],
					}),
				]),
			);
		});
	});

	suite("Resource Existence", () => {
		test("Returns an error when folder does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId: faker.string.uuid(),
						name: "Test Agenda Item",
						type: "general",
					},
				},
			});

			expect(result.data?.createAgendaItem).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						message: expect.any(String),
						path: ["createAgendaItem"],
					}),
				]),
			);
		});

		test("Returns an error when folder is not an agenda item folder", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			// Create a folder that is NOT an agenda item folder
			const nonItemFolderId = await createNonAgendaItemFolder(
				adminAuthToken,
				eventId,
			);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId: nonItemFolderId,
						name: "Test Agenda Item",
						type: "general",
					},
				},
			});

			expect(result.data?.createAgendaItem).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "folderId"],
									message:
										"This agenda folder cannot be a folder to agenda items.",
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createAgendaItem"],
					}),
				]),
			);
		});
	});

	suite("Input Validation", () => {
		test("Returns error when note type has duration", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Invalid Note",
						type: "note",
						duration: "00:30:00",
					},
				},
			});

			expect(result.data?.createAgendaItem).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						message: expect.any(String),
						path: ["createAgendaItem"],
					}),
				]),
			);
		});

		test("Returns error when note type has key", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Invalid Note",
						type: "note",
						key: "C Major",
					},
				},
			});

			expect(result.data?.createAgendaItem).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						message: expect.any(String),
						path: ["createAgendaItem"],
					}),
				]),
			);
		});

		test("Returns error when note type has both duration and key", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Invalid Note",
						type: "note",
						duration: "00:30:00",
						key: "C Major",
					},
				},
			});

			expect(result.data?.createAgendaItem).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						message: expect.any(String),
						path: ["createAgendaItem"],
					}),
				]),
			);
		});

		test("Returns error when general type has key", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Invalid General",
						type: "general",
						key: "C Major",
					},
				},
			});

			expect(result.data?.createAgendaItem).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						message: expect.any(String),
						path: ["createAgendaItem"],
					}),
				]),
			);
		});

		test("Returns error when scripture type has key", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Invalid Scripture",
						type: "scripture",
						key: "C Major",
					},
				},
			});

			expect(result.data?.createAgendaItem).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						message: expect.any(String),
						path: ["createAgendaItem"],
					}),
				]),
			);
		});

		test("Creates song type agenda item with key successfully", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(
				Mutation_createAgendaItemWithKey,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							folderId,
							name: "Amazing Grace",
							type: "song",
							key: "G Major",
							duration: "00:05:00",
						},
					},
				},
			);

			assertToBeNonNullish(result.data?.createAgendaItem);
			expect(result.data.createAgendaItem.name).toEqual("Amazing Grace");
			expect(result.data.createAgendaItem.key).toEqual("G Major");
			expect(result.data.createAgendaItem.type).toEqual("song");
			expect(result.errors).toBeUndefined();
		});
	});

	suite("Successful Creation", () => {
		test("Creates agenda item successfully with required fields", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Test Agenda Item",
						type: "general",
					},
				},
			});

			assertToBeNonNullish(result.data?.createAgendaItem);
			expect(result.data.createAgendaItem.name).toEqual("Test Agenda Item");
			expect(result.data.createAgendaItem.type).toEqual("general");
			expect(result.errors).toBeUndefined();
		});

		test("Creates agenda item with description and duration", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Meeting",
						type: "general",
						description: "Monthly team meeting",
						duration: "01:00:00",
					},
				},
			});

			assertToBeNonNullish(result.data?.createAgendaItem);
			expect(result.data.createAgendaItem.name).toEqual("Meeting");
			expect(result.data.createAgendaItem.description).toEqual(
				"Monthly team meeting",
			);
			expect(result.data.createAgendaItem.duration).toEqual("01:00:00");
			expect(result.errors).toBeUndefined();
		});

		test("Creates song type agenda item", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Amazing Grace",
						type: "song",
						duration: "00:05:00",
					},
				},
			});

			assertToBeNonNullish(result.data?.createAgendaItem);
			expect(result.data.createAgendaItem.name).toEqual("Amazing Grace");
			expect(result.data.createAgendaItem.type).toEqual("song");
			expect(result.errors).toBeUndefined();
		});

		test("Allows super admin to create agenda item without organization membership", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			// Create organization with a different user as admin
			const regularUser = await createRegularUserUsingAdmin();

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
			assertToBeNonNullish(createOrgResult.data?.createOrganization);
			const organizationId = createOrgResult.data.createOrganization.id;

			await addOrganizationMembership({
				adminAuthToken,
				memberId: regularUser.userId,
				organizationId,
				role: "administrator",
			});

			// Create event with the regular user (org admin)
			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${regularUser.authToken}` },
					variables: {
						input: {
							name: `Event ${faker.string.uuid()}`,
							organizationId,
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
							endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
							description: "Test event",
						},
					},
				},
			);
			assertToBeNonNullish(createEventResult.data?.createEvent);
			const eventId = createEventResult.data.createEvent.id;

			// Create folder with regular user
			const createFolderResult = await mercuriusClient.mutate(
				Mutation_createAgendaFolder,
				{
					headers: { authorization: `bearer ${regularUser.authToken}` },
					variables: {
						input: {
							name: "Folder",
							eventId,
							description: "desc",
							sequence: 1,
							organizationId: "org-id"
						},
					},
				},
			);
			assertToBeNonNullish(createFolderResult.data?.createAgendaFolder);
			const folderId = createFolderResult.data.createAgendaFolder.id;

			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: eventId } },
				});
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: organizationId } },
				});
			});

			// Super admin attempts to create agenda item (not a member of org)
			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Super Admin Item",
						type: "general",
					},
				},
			});

			assertToBeNonNullish(result.data?.createAgendaItem);
			expect(result.data.createAgendaItem.name).toEqual("Super Admin Item");
			expect(result.errors).toBeUndefined();
		});

		test("Allows organization administrator to create agenda item", async () => {
			const [{ token: adminAuthToken }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, folderId, organizationId } = await createTestEnvironment(
				adminAuthToken,
				await getAdminUserId(),
			);
			testCleanupFunctions.push(cleanup);

			// Add regular user as organization admin
			await addOrganizationMembership({
				adminAuthToken,
				memberId: regularUser.userId,
				organizationId,
				role: "administrator",
			});

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: {
					input: {
						folderId,
						name: "Org Admin Item",
						type: "general",
					},
				},
			});

			assertToBeNonNullish(result.data?.createAgendaItem);
			expect(result.data.createAgendaItem.name).toEqual("Org Admin Item");
			expect(result.errors).toBeUndefined();
		});
	});

	suite("Attachments", () => {
		test("Successfully creates agenda item with attachments", async () => {
			const { token: adminAuthToken, userId: adminUserId } =
				await getAdminAuth();
			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				adminUserId,
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Agenda Item With Attachments",
						type: "general",
						attachments: [
							{
								objectName: "test-object-1",
								fileHash:
									"a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
								mimeType: "IMAGE_PNG",
								name: "test-image.png",
							},
							{
								objectName: "test-object-2",
								fileHash:
									"b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
								mimeType: "IMAGE_JPEG",
								name: "test-photo.jpg",
							},
						],
					},
				},
			});

			assertToBeNonNullish(result.data?.createAgendaItem);
			expect(result.data.createAgendaItem.name).toEqual(
				"Agenda Item With Attachments",
			);
			expect(result.errors).toBeUndefined();

			// Verify attachments were stored in database with complete metadata
			const agendaItemId = result.data.createAgendaItem?.id;
			const attachments =
				await server.drizzleClient.query.agendaItemAttachmentsTable.findMany({
					where: (fields, { eq }) => eq(fields.agendaItemId, agendaItemId),
				});

			expect(attachments).toHaveLength(2);

			// Verify first attachment with complete metadata
			const attachment1 = attachments.find(
				(a) => a.objectName === "test-object-1",
			);
			assertToBeNonNullish(attachment1);
			expect(attachment1.fileHash).toEqual(
				"a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
			);
			expect(attachment1.mimeType).toEqual("image/png");
			expect(attachment1.name).toEqual("test-image.png");

			// Verify second attachment with complete metadata
			const attachment2 = attachments.find(
				(a) => a.objectName === "test-object-2",
			);
			assertToBeNonNullish(attachment2);
			expect(attachment2.fileHash).toEqual(
				"b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
			);
			expect(attachment2.mimeType).toEqual("image/jpeg");
			expect(attachment2.name).toEqual("test-photo.jpg");
		});

		test("Successfully creates agenda item without attachments", async () => {
			const { token: adminAuthToken, userId: adminUserId } =
				await getAdminAuth();
			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				adminUserId,
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Agenda Item Without Attachments",
						type: "general",
					},
				},
			});

			assertToBeNonNullish(result.data?.createAgendaItem);
			expect(result.data.createAgendaItem.name).toEqual(
				"Agenda Item Without Attachments",
			);
			expect(result.errors).toBeUndefined();

			// Verify no attachments were created
			const agendaItemId = result.data.createAgendaItem.id;
			const attachments =
				await server.drizzleClient.query.agendaItemAttachmentsTable.findMany({
					where: (fields, { eq }) => eq(fields.agendaItemId, agendaItemId),
				});
			expect(attachments).toHaveLength(0);
		});

		test("Successfully creates agenda item with empty attachments array", async () => {
			const { token: adminAuthToken, userId: adminUserId } =
				await getAdminAuth();
			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				adminUserId,
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Agenda Item Empty Attachments",
						type: "general",
						attachments: [],
					},
				},
			});

			assertToBeNonNullish(result.data?.createAgendaItem);
			expect(result.data.createAgendaItem.name).toEqual(
				"Agenda Item Empty Attachments",
			);
			expect(result.errors).toBeUndefined();

			// Verify no attachments were created
			const agendaItemId = result.data.createAgendaItem.id;
			const attachments =
				await server.drizzleClient.query.agendaItemAttachmentsTable.findMany({
					where: (fields, { eq }) => eq(fields.agendaItemId, agendaItemId),
				});
			expect(attachments).toHaveLength(0);
		});

		test("Rejects invalid fileHash format", async () => {
			const { token: adminAuthToken, userId: adminUserId } =
				await getAdminAuth();
			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				adminUserId,
			);
			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Invalid Hash Test",
						type: "general",
						attachments: [
							{
								objectName: "test-obj",
								fileHash: "invalid-hash-not-64-chars",
								mimeType: "IMAGE_PNG",
								name: "test.png",
							},
						],
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
			// Assert the error is for the correct field
			const issues = result.errors?.[0]?.extensions?.issues as
				| Array<{ argumentPath: unknown[] }>
				| undefined;
			expect(issues).toBeDefined();
			expect(issues?.[0]?.argumentPath).toContain("attachments");
		});

		test("Rejects more than 10 attachments", async () => {
			const { token: adminAuthToken, userId: adminUserId } =
				await getAdminAuth();
			const { cleanup, folderId } = await createTestEnvironment(
				adminAuthToken,
				adminUserId,
			);
			testCleanupFunctions.push(cleanup);

			const attachments = Array.from({ length: 11 }, (_, i) => ({
				objectName: `test-obj-${i}`,
				fileHash:
					"a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
				mimeType: "IMAGE_PNG" as const,
				name: `test-${i}.png`,
			}));

			const result = await mercuriusClient.mutate(Mutation_createAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						folderId,
						name: "Too Many Attachments",
						type: "general",
						attachments,
					},
				},
			});

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
			// Assert the error is for the correct field
			const issues = result.errors?.[0]?.extensions?.issues as
				| Array<{ argumentPath: unknown[] }>
				| undefined;
			expect(issues).toBeDefined();
			expect(issues?.[0]?.argumentPath).toContain("attachments");
		});
	});
});
