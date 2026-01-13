import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test } from "vitest";
import {
	agendaFoldersTable,
	agendaItemsTable,
	usersTable,
} from "~/src/drizzle/schema";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
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
	Mutation_deleteAgendaItem,
	Mutation_deleteOrganization,
	Mutation_deleteOrganizationMembership,
	Mutation_deleteStandaloneEvent,
	Mutation_updateAgendaItem,
	Query_signIn,
} from "../documentNodes";

// Helper Types
interface TestAgendaItem {
	agendaItemId: string;
	orgId: string;
	eventId: string;
	folderId: string;
	cleanup: () => Promise<void>;
}

/**
 * Helper function to get admin auth token with proper error handling
 * @throws {Error} If admin credentials are invalid or missing
 * @returns {Promise<string>} Admin authentication token
 */
let cachedAdminToken: string | null = null;
let cachedAdminId: string | null = null;
async function getAdminAuthTokenAndId(): Promise<{
	cachedAdminToken: string;
	cachedAdminId: string;
}> {
	if (cachedAdminToken && cachedAdminId) {
		return { cachedAdminToken, cachedAdminId };
	}

	try {
		// Check if admin credentials exist
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
		// Check for GraphQL errors
		if (adminSignInResult.errors) {
			throw new Error(
				`Admin authentication failed: ${
					adminSignInResult.errors[0]?.message || "Unknown error"
				}`,
			);
		}
		// Check for missing data
		if (!adminSignInResult.data?.signIn?.authenticationToken) {
			throw new Error(
				"Admin authentication succeeded but no token was returned",
			);
		}
		if (!adminSignInResult.data?.signIn?.user?.id) {
			throw new Error(
				"Admin authentication succeeded but no user id was returned",
			);
		}
		const token = adminSignInResult.data.signIn.authenticationToken;
		const id = adminSignInResult.data.signIn.user.id;
		cachedAdminToken = token;
		cachedAdminId = id;
		return { cachedAdminToken: token, cachedAdminId: id };
	} catch (error) {
		// Wrap and rethrow with more context
		throw new Error(
			`Failed to get admin authentication token: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}

async function createTestAgendaItem(): Promise<TestAgendaItem> {
	const { cachedAdminToken: adminAuthToken, cachedAdminId: adminId } =
		await getAdminAuthTokenAndId();

	// Create organization
	const createOrgResult = await mercuriusClient.mutate(
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

	assertToBeNonNullish(createOrgResult.data);
	assertToBeNonNullish(createOrgResult.data.createOrganization);
	const orgId = createOrgResult.data.createOrganization.id;

	// Create organization membership for the admin user
	const membershipResult = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					organizationId: orgId,
					memberId: adminId,
					role: "administrator",
				},
			},
		},
	);

	if (membershipResult.errors) {
		throw new Error(
			`Failed to create organization membership. Errors: ${JSON.stringify(
				membershipResult.errors,
			)}`,
		);
	}

	// Create event
	const createEventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				name: `Event ${faker.string.uuid()}`,
				organizationId: orgId,
				startAt: new Date(Date.now() + 86400000).toISOString(),
				endAt: new Date(Date.now() + 90000000).toISOString(),
				description: "Test event",
			},
		},
	});

	assertToBeNonNullish(createEventResult.data);
	assertToBeNonNullish(createEventResult.data.createEvent);
	const eventId = createEventResult.data.createEvent.id;

	// Create agenda folder
	const createFolderResult = await mercuriusClient.mutate(
		Mutation_createAgendaFolder,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: `Folder ${faker.string.uuid()}`,
					eventId: eventId,
					isAgendaItemFolder: true,
				},
			},
		},
	);

	assertToBeNonNullish(createFolderResult.data);
	assertToBeNonNullish(createFolderResult.data.createAgendaFolder);
	const folderId = createFolderResult.data.createAgendaFolder.id;

	// Create agenda item
	const createAgendaItemResult = await mercuriusClient.mutate(
		Mutation_createAgendaItem,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: `Agenda Item ${faker.string.uuid()}`,
					folderId: folderId,
					type: "general",
					duration: "30m",
					description: "Test agenda item description",
				},
			},
		},
	);

	assertToBeNonNullish(createAgendaItemResult.data);
	assertToBeNonNullish(createAgendaItemResult.data.createAgendaItem);
	const agendaItemId = createAgendaItemResult.data.createAgendaItem.id;

	return {
		agendaItemId,
		orgId,
		eventId,
		folderId,
		cleanup: async () => {
			const errors: Error[] = [];
			try {
				await mercuriusClient.mutate(Mutation_deleteAgendaItem, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: agendaItemId } },
				});
			} catch (error) {
				errors.push(error as Error);
				console.error("Failed to delete agenda item:", error);
			}
			try {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: eventId } },
				});
			} catch (error) {
				errors.push(error as Error);
				console.error("Failed to delete event:", error);
			}
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (error) {
				errors.push(error as Error);
				console.error("Failed to delete organization:", error);
			}
			if (errors.length > 0) {
				throw new AggregateError(errors, "One or more cleanup steps failed");
			}
		},
	};
}

async function createOrganizationMembership(
	authToken: string,
	memberId: string,
	orgId: string,
	role?: "administrator" | "regular",
) {
	const createOrganizationMembershipResult = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					memberId,
					organizationId: orgId,
					role,
				},
			},
		},
	);

	assertToBeNonNullish(createOrganizationMembershipResult.data);
	assertToBeNonNullish(
		createOrganizationMembershipResult.data.createOrganizationMembership,
	);
	assertToBeNonNullish(
		createOrganizationMembershipResult.data.createOrganizationMembership.id,
	);
	const organizationMembershipId =
		createOrganizationMembershipResult.data.createOrganizationMembership.id;
	return {
		organizationMembershipId,
		cleanup: async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						memberId,
						organizationId: orgId,
					},
				},
			});
		},
	};
}

suite("Mutation updateAgendaItem", () => {
	suite("Authentication and Authorization", () => {
		const testCleanupFunctions: Array<() => Promise<void>> = [];

		afterEach(async () => {
			for (const cleanup of testCleanupFunctions.reverse()) {
				try {
					await cleanup();
				} catch (error) {
					console.error("Cleanup failed:", error);
				}
			}
			// Reset the cleanup functions array
			testCleanupFunctions.length = 0;
		});
		test("Returns an error when the user is unauthenticated", async () => {
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated agenda item name",
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["updateAgendaItem"],
					}),
				]),
			);
		});

		test("Returns an error when the user is present in the token but not found in the database", async () => {
			// create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// get the user's auth token
			const { authToken } = regularUser;
			// delete the user
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId))
				.execute();
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated agenda item name",
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["updateAgendaItem"],
					}),
				]),
			);
		});

		test("Returns an error when a non-admin, non-organization member tries to update an agenda item", async () => {
			// create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// get the user's auth token
			const { authToken } = regularUser;
			// create an agenda item
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							name: "Updated agenda item name",
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "id"]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});

		test("Returns an error when a regular member of the organization tries to update an agenda item", async () => {
			// create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// get the user's auth token
			const { authToken } = regularUser;
			// create an agenda item
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);
			// create an organization membership
			const organizationMembership = await createOrganizationMembership(
				authToken,
				regularUser.userId,
				agendaItem.orgId,
			);
			testCleanupFunctions.push(organizationMembership.cleanup);
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							name: "Updated agenda item name",
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "id"]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});

		test("Successfully updates the agenda item when an organization admin tries to update it", async () => {
			// create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// get the user's auth token
			const { authToken } = regularUser;
			// get admin auth token
			const { cachedAdminToken: adminAuthToken } =
				await getAdminAuthTokenAndId();
			// create an agenda item
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);
			// create an organization membership
			const organizationMembership = await createOrganizationMembership(
				adminAuthToken,
				regularUser.userId,
				agendaItem.orgId,
				"administrator",
			);
			testCleanupFunctions.push(organizationMembership.cleanup);
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							name: "Updated agenda item name",
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeUndefined();
			expect(updateAgendaItemResult.data).toBeDefined();
			expect(updateAgendaItemResult.data.updateAgendaItem).toBeDefined();
			assertToBeNonNullish(updateAgendaItemResult.data.updateAgendaItem);
			assertToBeNonNullish(updateAgendaItemResult.data.updateAgendaItem.id);
			expect(updateAgendaItemResult.data.updateAgendaItem.id).toEqual(
				agendaItem.agendaItemId,
			);
			expect(updateAgendaItemResult.data.updateAgendaItem.name).toEqual(
				"Updated agenda item name",
			);
		});
		test("Successfully updates the agenda item when an admin (non-organization member) tries to update it", async () => {
			// get admin auth token
			const { cachedAdminToken: adminAuthToken } =
				await getAdminAuthTokenAndId();
			// create an agenda item
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							name: "Updated agenda item name",
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeUndefined();
			expect(updateAgendaItemResult.data).toBeDefined();
			expect(updateAgendaItemResult.data.updateAgendaItem).toBeDefined();
			assertToBeNonNullish(updateAgendaItemResult.data.updateAgendaItem);
			assertToBeNonNullish(updateAgendaItemResult.data.updateAgendaItem.id);
			expect(updateAgendaItemResult.data.updateAgendaItem.id).toEqual(
				agendaItem.agendaItemId,
			);
			expect(updateAgendaItemResult.data.updateAgendaItem.name).toEqual(
				"Updated agenda item name",
			);
		});
	});

	suite("Input Validation", () => {
		const testCleanupFunctions: Array<() => Promise<void>> = [];

		afterEach(async () => {
			for (const cleanup of testCleanupFunctions.reverse()) {
				try {
					await cleanup();
				} catch (error) {
					console.error("Cleanup failed:", error);
				}
			}
			// Reset the cleanup functions array
			testCleanupFunctions.length = 0;
		});
		test("Returns an error when id and folderId are not valid UUIDs", async () => {
			// create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// get the user's auth token
			const { authToken } = regularUser;

			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: "invalid-uuid",
							folderId: "invalid-uuid",
							name: "Updated agenda item name",
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "id"]),
								}),
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "folderId"]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
		test("Returns an error when only id is provided", async () => {
			// create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// get the user's auth token
			const { authToken } = regularUser;

			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);

			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									message: expect.stringContaining(
										"At least one optional argument must be provided.",
									),
									argumentPath: expect.arrayContaining(["input"]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
	});

	suite("Type Specific Validation", () => {
		const testCleanupFunctions: Array<() => Promise<void>> = [];

		afterEach(async () => {
			for (const cleanup of testCleanupFunctions.reverse()) {
				try {
					await cleanup();
				} catch (error) {
					console.error("Cleanup failed:", error);
				}
			}
			// Reset the cleanup functions array
			testCleanupFunctions.length = 0;
		});
		test("Returns an error when the type is note and duration is provided", async () => {
			// create regular user
			const regularUser = await createRegularUserUsingAdmin();

			// get the user's auth token
			const { authToken } = regularUser;
			// create an agenda item
			const agendaItem = await createTestAgendaItem();
			await server.drizzleClient
				.update(agendaItemsTable)
				.set({
					type: "note",
					duration: null,
				})
				.where(eq(agendaItemsTable.id, agendaItem.agendaItemId))
				.execute();

			testCleanupFunctions.push(agendaItem.cleanup);
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							duration: "30m",
							name: "Updated agenda item name",
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "duration"]),
									message:
										'Cannot be provided for an agenda item of type "note"',
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
		test("Returns an error when the type is note and key is provided", async () => {
			// create regular user
			const regularUser = await createRegularUserUsingAdmin();

			// get the user's auth token
			const { authToken } = regularUser;
			// create an agenda item
			const agendaItem = await createTestAgendaItem();
			await server.drizzleClient
				.update(agendaItemsTable)
				.set({
					type: "note",
				})
				.where(eq(agendaItemsTable.id, agendaItem.agendaItemId))
				.execute();

			testCleanupFunctions.push(agendaItem.cleanup);
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							key: "key",
							name: "Updated agenda item name",
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "key"]),
									message:
										'Cannot be provided for an agenda item of type "note"',
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
		test("Returns an error when the type is general and key is provided", async () => {
			// create regular user
			const regularUser = await createRegularUserUsingAdmin();

			// get the user's auth token
			const { authToken } = regularUser;
			// create an agenda item
			const agendaItem = await createTestAgendaItem();
			await server.drizzleClient
				.update(agendaItemsTable)
				.set({
					type: "general",
				})
				.where(eq(agendaItemsTable.id, agendaItem.agendaItemId))
				.execute();

			testCleanupFunctions.push(agendaItem.cleanup);
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							key: "key",
							name: "Updated agenda item name",
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "key"]),
									message:
										'Cannot be provided for an agenda item of type "general"',
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
		test("Returns an error when the type is scripture and key is provided", async () => {
			// create regular user
			const regularUser = await createRegularUserUsingAdmin();

			// get the user's auth token
			const { authToken } = regularUser;
			// create an agenda item
			const agendaItem = await createTestAgendaItem();
			await server.drizzleClient
				.update(agendaItemsTable)
				.set({
					type: "scripture",
				})
				.where(eq(agendaItemsTable.id, agendaItem.agendaItemId))
				.execute();

			testCleanupFunctions.push(agendaItem.cleanup);
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							key: "key",
							name: "Updated agenda item name",
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "key"]),
									message:
										'Cannot be provided for an agenda item of type "scripture"',
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
	});

	suite("resource existence", () => {
		const testCleanupFunctions: Array<() => Promise<void>> = [];

		afterEach(async () => {
			for (const cleanup of testCleanupFunctions.reverse()) {
				try {
					await cleanup();
				} catch (error) {
					console.error("Cleanup failed:", error);
				}
			}
			// Reset the cleanup functions array
			testCleanupFunctions.length = 0;
		});
		test("Returns an error when the agenda item does not exist", async () => {
			// create regular user
			const regularUser = await createRegularUserUsingAdmin();
			// get the user's auth token
			const { authToken } = regularUser;
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated agenda item name",
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "id"]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
		test("Returns an error when the agenda folder does not exist", async () => {
			// create regular user
			const regularUser = await createRegularUserUsingAdmin();

			// get the user's auth token
			const { authToken } = regularUser;
			// create an agenda item
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							name: "Updated agenda item name",
							folderId: faker.string.uuid(),
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "folderId"]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
		test("Returns an error when the agenda folder does not belong to the agenda item's event", async () => {
			// create regular user
			const regularUser = await createRegularUserUsingAdmin();
			// create two agendaItems and use the folder of the first agenda item for the second agenda item
			const agendaItem1 = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem1.cleanup);
			const agendaItem2 = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem2.cleanup);
			// get the user's auth token
			const { authToken } = regularUser;
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: agendaItem2.agendaItemId,
							name: "Updated agenda item name",
							folderId: agendaItem1.folderId,
						},
					},
				},
			);
			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "folderId"]),
									message: expect.stringContaining(
										"This agenda folder does not belong to the event to the agenda item.",
									),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});

		test("Returns an error when the agenda folder cannot be a folder for agenda items", async () => {
			// create regular user
			const regularUser = await createRegularUserUsingAdmin();
			// create an agendaItem and use the folder of the agenda item for the event
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);

			// update agenda folder's isAgendaItemFolder to false
			await server.drizzleClient
				.update(agendaFoldersTable)
				.set({
					isDefaultFolder: false,
				})
				.where(eq(agendaFoldersTable.id, agendaItem.folderId))
				.execute();

			// get the user's auth token
			const { authToken } = regularUser;
			// try to update the agenda item
			const updateAgendaItemResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							name: "Updated agenda item name",
							folderId: agendaItem.folderId,
						},
					},
				},
			);

			expect(updateAgendaItemResult.errors).toBeDefined();
			expect(updateAgendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "folderId"]),
									message: expect.stringContaining(
										"This agenda folder cannot be a folder to agenda items.",
									),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
	});

	suite("Attachments", () => {
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

		test("Successfully updates agenda item with new attachments", async () => {
			const { cachedAdminToken: adminAuthToken } =
				await getAdminAuthTokenAndId();
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);

			const updateResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							name: "Updated With Attachments",
							attachments: [
								{
									objectName: "update-object-1",
									fileHash:
										"c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
									mimeType: "IMAGE_PNG",
									name: "update-image.png",
								},
							],
						},
					},
				},
			);

			expect(updateResult.errors).toBeUndefined();
			assertToBeNonNullish(updateResult.data?.updateAgendaItem);
			expect(updateResult.data.updateAgendaItem.name).toEqual(
				"Updated With Attachments",
			);

			// Verify attachment stored with complete metadata
			const attachments =
				await server.drizzleClient.query.agendaItemAttachmentsTable.findMany({
					where: (fields, { eq }) =>
						eq(fields.agendaItemId, agendaItem.agendaItemId),
				});
			expect(attachments).toHaveLength(1);
			expect(attachments[0]?.objectName).toEqual("update-object-1");
			expect(attachments[0]?.fileHash).toEqual(
				"c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
			);
			expect(attachments[0]?.mimeType).toEqual("image/png");
			expect(attachments[0]?.name).toEqual("update-image.png");
		});

		test("Successfully replaces existing attachments", async () => {
			const { cachedAdminToken: adminAuthToken } =
				await getAdminAuthTokenAndId();
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);

			// First update - add initial attachment
			const firstUpdateResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							name: "First Update",
							attachments: [
								{
									objectName: "initial-object",
									fileHash:
										"d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5",
									mimeType: "IMAGE_PNG",
									name: "initial.png",
								},
							],
						},
					},
				},
			);

			// Assert first update succeeded before proceeding
			expect(firstUpdateResult.errors).toBeUndefined();

			// Second update - replace with new attachment
			const updateResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							name: "Second Update",
							attachments: [
								{
									objectName: "replaced-object",
									fileHash:
										"e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
									mimeType: "IMAGE_JPEG",
									name: "replaced.jpg",
								},
							],
						},
					},
				},
			);

			expect(updateResult.errors).toBeUndefined();

			// Verify only new attachment exists
			const attachments =
				await server.drizzleClient.query.agendaItemAttachmentsTable.findMany({
					where: (fields, { eq }) =>
						eq(fields.agendaItemId, agendaItem.agendaItemId),
				});
			expect(attachments).toHaveLength(1);
			expect(attachments[0]?.objectName).toEqual("replaced-object");
		});

		test("Successfully removes all attachments with empty array", async () => {
			const { cachedAdminToken: adminAuthToken } =
				await getAdminAuthTokenAndId();
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);

			// First add an attachment
			await mercuriusClient.mutate(Mutation_updateAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: agendaItem.agendaItemId,
						name: "Has Attachment",
						attachments: [
							{
								objectName: "to-be-removed",
								fileHash:
									"f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1",
								mimeType: "IMAGE_PNG",
								name: "remove.png",
							},
						],
					},
				},
			});

			// Then remove all attachments
			const removeResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							name: "No Attachments",
							attachments: [],
						},
					},
				},
			);

			expect(removeResult.errors).toBeUndefined();

			// Verify no attachments remain
			const attachments =
				await server.drizzleClient.query.agendaItemAttachmentsTable.findMany({
					where: (fields, { eq }) =>
						eq(fields.agendaItemId, agendaItem.agendaItemId),
				});
			expect(attachments).toHaveLength(0);
		});

		test("Preserves existing attachments when attachments field is omitted", async () => {
			const { cachedAdminToken: adminAuthToken } =
				await getAdminAuthTokenAndId();
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);

			// First add an attachment
			await mercuriusClient.mutate(Mutation_updateAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: agendaItem.agendaItemId,
						name: "Has Attachment",
						attachments: [
							{
								objectName: "preserve-test",
								fileHash:
									"a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
								mimeType: "IMAGE_PNG",
								name: "preserve.png",
							},
						],
					},
				},
			});

			// Update without attachments field - should preserve existing
			const updateResult = await mercuriusClient.mutate(
				Mutation_updateAgendaItem,
				{
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							id: agendaItem.agendaItemId,
							name: "Updated Name Only",
						},
					},
				},
			);

			expect(updateResult.errors).toBeUndefined();

			// Verify attachment is preserved
			const attachmentsAfterUpdate =
				await server.drizzleClient.query.agendaItemAttachmentsTable.findMany({
					where: (fields, { eq }) =>
						eq(fields.agendaItemId, agendaItem.agendaItemId),
				});
			expect(attachmentsAfterUpdate).toHaveLength(1);
			expect(attachmentsAfterUpdate[0]?.objectName).toEqual("preserve-test");
		});

		test("Rejects invalid fileHash format on update", async () => {
			const { cachedAdminToken: adminAuthToken } =
				await getAdminAuthTokenAndId();
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);

			const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: agendaItem.agendaItemId,
						name: "Invalid Hash Update",
						attachments: [
							{
								objectName: "test",
								fileHash: "INVALID-NOT-64-CHARS",
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

		test("Rejects more than 10 attachments on update", async () => {
			const { cachedAdminToken: adminAuthToken } =
				await getAdminAuthTokenAndId();
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);

			const attachments = Array.from({ length: 11 }, (_, i) => ({
				objectName: `test-obj-${i}`,
				fileHash:
					"a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
				mimeType: "IMAGE_PNG" as const,
				name: `test-${i}.png`,
			}));

			const result = await mercuriusClient.mutate(Mutation_updateAgendaItem, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: agendaItem.agendaItemId,
						name: "Too Many Attachments Update",
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
