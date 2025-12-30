import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test } from "vitest";

import { usersTable } from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createAgendaFolder,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
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

		// Fetching admin authentication token and user id from the database
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		// Check for GraphQL errors
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

// This Helper function creates an environment consisting of an organization and an event
async function createOrganizationAndEvent(
	adminAuthToken: string,
	adminUserId: string,
) {
	const createOrganizationResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
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

	// Ensure the admin user is a member of the organization to create events
	await addOrganizationMembership({
		adminAuthToken,
		memberId: adminUserId,
		organizationId,
		role: "administrator",
	});

	// Helper function to check if the event was created successfully
	const createEventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				name: `Event ${faker.string.uuid()}`,
				organizationId,
				startAt: new Date(Date.now() + 86400000).toISOString(),
				endAt: new Date(Date.now() + 90000000).toISOString(),
				description: "Agenda folder test event",
			},
		},
	});

	assertToBeNonNullish(createEventResult.data?.createEvent);

	const eventId = createEventResult.data.createEvent.id;

	return {
		organizationId,
		eventId,
		cleanup: async () => {
			await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: eventId,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: organizationId,
					},
				},
			});
		},
	};
}

// This helper function is to make adminstrator member of an organization
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

// This helper function is to get the admin user id from the cached admin authentication
async function getAdminUserId(): Promise<string> {
	if (cachedAdminAuth?.userId) {
		return cachedAdminAuth.userId;
	}
	const auth = await getAdminAuth();
	return auth.userId;
}

suite("Mutation field createAgendaFolder", () => {
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

	suite("Authorization and Authentication", () => {
		test("Returns an error if the client is not authenticated", async () => {
			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				variables: {
					input: {
						name: "Test Folder",
						eventId: faker.string.uuid(),
						isAgendaItemFolder: true,
					},
				},
			});

			expect(result.data?.createAgendaFolder).toEqual(null);

			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["createAgendaFolder"],
					}),
				]),
			);
		});

		test("Returns an error if the user is present in the token but not in the database", async () => {
			const regularUser = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId));

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						name: "Test Folder",
						eventId: faker.string.uuid(),
						isAgendaItemFolder: true,
					},
				},
			});

			expect(result.data.createAgendaFolder).toEqual(null);

			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["createAgendaFolder"],
					}),
				]),
			);
		});

		test("Returns an error when a non-member regular user tries to create a folder", async () => {
			const [{ token: adminAuthToken }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, eventId } = await createOrganizationAndEvent(
				adminAuthToken,
				await getAdminUserId(),
			);

			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						name: "Test Folder",
						eventId,
						isAgendaItemFolder: true,
					},
				},
			});

			expect(result.data.createAgendaFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "eventId"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createAgendaFolder"],
					}),
				]),
			);
		});

		test("Returns an error when an organization member without admin rights tries to create a folder", async () => {
			const [{ token: adminAuthToken }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, eventId, organizationId } =
				await createOrganizationAndEvent(
					adminAuthToken,
					await getAdminUserId(),
				);

			testCleanupFunctions.push(cleanup);

			await addOrganizationMembership({
				adminAuthToken,
				memberId: regularUser.userId,
				organizationId,
				role: "regular",
			});

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						name: "Test Folder",
						eventId,
						isAgendaItemFolder: true,
					},
				},
			});

			expect(result.data.createAgendaFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "eventId"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createAgendaFolder"],
					}),
				]),
			);
		});
		test("Allows super admin to create folder WITHOUT organization membership", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			// Create a new Organization to isolate this test context
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

			// Create a separate user to act as the Organization Administrator
			// This user will own the event, ensuring the Super Admin has no direct ownership relation
			const regularUser = await createRegularUserUsingAdmin();

			await addOrganizationMembership({
				adminAuthToken,
				memberId: regularUser.userId,
				organizationId,
				role: "administrator",
			});

			// Create the target Event using the Organization Administrator's credentials
			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${regularUser.authToken}` },
					variables: {
						input: {
							name: `Event ${faker.string.uuid()}`,
							organizationId,
							startAt: new Date(Date.now() + 86400000).toISOString(),
							endAt: new Date(Date.now() + 90000000).toISOString(),
							description: "Test event for super admin bypass",
						},
					},
				},
			);

			assertToBeNonNullish(createEventResult.data?.createEvent);
			const eventId = createEventResult.data.createEvent.id;

			// Register cleanup operations immediately to ensure database hygiene on failure
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

			// Execute Mutation: Super Admin attempts to create a folder
			// Note: The Admin is NOT a member of the organization, validating the global role bypass
			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						name: "Super Admin Global Access Folder",
						eventId,
						isAgendaItemFolder: false,
					},
				},
			});

			// Verify the folder was created successfully
			assertToBeNonNullish(result.data?.createAgendaFolder);
			expect(result.data.createAgendaFolder.name).toEqual(
				"Super Admin Global Access Folder",
			);
			expect(result.errors).toBeUndefined();
		});

		test("Allows super admin to create folder as organization administrator", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				adminAuthToken,
				await getAdminUserId(),
			);

			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "Super Admin Folder",
						eventId,
						isAgendaItemFolder: false,
					},
				},
			});

			assertToBeNonNullish(result.data?.createAgendaFolder);
			expect(result.data.createAgendaFolder.name).toEqual("Super Admin Folder");
			expect(result.errors).toBeUndefined();
		});
	});

	suite("Input Validation", () => {
		test("Returns an error when invalid arguments are provided", async () => {
			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				variables: {
					input: {
						name: 123 as unknown as string,
						eventId: "not-a-uuid",
						isAgendaItemFolder: true,
					},
				},
			});

			expect(result.data?.createAgendaFolder ?? null).toEqual(null);

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
	});

	suite("Resource Existence", () => {
		test("Returns an error when event does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "Test Folder",
						eventId: faker.string.uuid(),
						isAgendaItemFolder: true,
					},
				},
			});

			expect(result.data.createAgendaFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "eventId"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createAgendaFolder"],
					}),
				]),
			);
		});

		test("Returns an error when parent folder does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				adminAuthToken,
				await getAdminUserId(),
			);

			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "Test Folder",
						eventId,
						parentFolderId: faker.string.uuid(),
						isAgendaItemFolder: false,
					},
				},
			});

			expect(result.data.createAgendaFolder).toEqual(null);
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
						path: ["createAgendaFolder"],
					}),
				]),
			);
		});

		test("Returns an error when parent folder belongs to different event", async () => {
			const { token: adminAuthToken } = await getAdminAuth();
			const adminUserId = await getAdminUserId();

			const { cleanup: cleanup1, eventId: eventId1 } =
				await createOrganizationAndEvent(adminAuthToken, adminUserId);
			testCleanupFunctions.push(cleanup1);

			const { cleanup: cleanup2, eventId: eventId2 } =
				await createOrganizationAndEvent(adminAuthToken, adminUserId);
			testCleanupFunctions.push(cleanup2);

			const createParentFolderResult = await mercuriusClient.mutate(
				Mutation_createAgendaFolder,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							name: "Parent Folder",
							eventId: eventId1,
							isAgendaItemFolder: false,
						},
					},
				},
			);

			assertToBeNonNullish(createParentFolderResult.data?.createAgendaFolder);
			const parentFolderId =
				createParentFolderResult.data.createAgendaFolder.id;

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "Child Folder",
						eventId: eventId2,
						parentFolderId,
						isAgendaItemFolder: false,
					},
				},
			});

			expect(result.data.createAgendaFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "parentFolderId"],
									message:
										"This agenda folder does not belong to the provided event.",
								}),
								expect.objectContaining({
									argumentPath: ["input", "eventId"],
									message:
										"This event does not contain the provided parent agenda folder.",
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createAgendaFolder"],
					}),
				]),
			);
		});

		test("Returns an error when parent folder cannot have children", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				adminAuthToken,
				await getAdminUserId(),
			);

			testCleanupFunctions.push(cleanup);

			const createParentFolderResult = await mercuriusClient.mutate(
				Mutation_createAgendaFolder,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							name: "Parent Folder",
							eventId,
							isAgendaItemFolder: true,
						},
					},
				},
			);

			assertToBeNonNullish(createParentFolderResult.data?.createAgendaFolder);
			const parentFolderId =
				createParentFolderResult.data.createAgendaFolder.id;

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "Child Folder",
						eventId,
						parentFolderId,
						isAgendaItemFolder: false,
					},
				},
			});

			expect(result.data.createAgendaFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "parentFolderId"],
									message:
										"This agenda folder cannot be a parent folder for other agenda folders.",
								}),
							]),
						}),
						message: expect.any(String),
						path: ["createAgendaFolder"],
					}),
				]),
			);
		});
	});

	suite("Successful Creation", () => {
		test("Creates agenda folder successfully when admin user creates it", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				adminAuthToken,
				await getAdminUserId(),
			);

			testCleanupFunctions.push(cleanup);

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "Test Folder",
						eventId,
						isAgendaItemFolder: true,
					},
				},
			});

			assertToBeNonNullish(result.data?.createAgendaFolder);
			const createdFolder = result.data.createAgendaFolder as {
				id: string;
				name: string | null;
				isAgendaItemFolder: boolean;
				event: { id: string } | null;
			};
			expect(createdFolder.name).toEqual("Test Folder");
			assertToBeNonNullish(createdFolder.event);
			expect(createdFolder.event.id).toEqual(eventId);
			expect(createdFolder.isAgendaItemFolder).toEqual(true);
			expect(result.errors).toBeUndefined();
		});

		test("Creates agenda folder with parent folder successfully", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				adminAuthToken,
				await getAdminUserId(),
			);

			testCleanupFunctions.push(cleanup);

			const createParentFolderResult = await mercuriusClient.mutate(
				Mutation_createAgendaFolder,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							name: "Parent Folder",
							eventId,
							isAgendaItemFolder: false,
						},
					},
				},
			);

			assertToBeNonNullish(createParentFolderResult.data?.createAgendaFolder);
			const parentFolderId =
				createParentFolderResult.data.createAgendaFolder.id;

			const result = await mercuriusClient.mutate(Mutation_createAgendaFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "Child Folder",
						eventId,
						parentFolderId,
						isAgendaItemFolder: false,
					},
				},
			});

			assertToBeNonNullish(result.data?.createAgendaFolder);
			const createdFolder = result.data.createAgendaFolder as {
				id: string;
				name: string | null;
				isAgendaItemFolder: boolean;
				event: { id: string } | null;
				parentFolder: { id: string } | null;
			};
			expect(createdFolder.name).toEqual("Child Folder");
			assertToBeNonNullish(createdFolder.event);
			expect(createdFolder.event.id).toEqual(eventId);
			assertToBeNonNullish(createdFolder.parentFolder);
			expect(createdFolder.parentFolder.id).toEqual(parentFolderId);
			expect(createdFolder.isAgendaItemFolder).toEqual(false);
			expect(result.errors).toBeUndefined();
		});
	});
});
