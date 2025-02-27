import { faker } from "@faker-js/faker";

import { afterEach, expect, suite, test } from "vitest";

import { eq } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/schema";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createAgendaFolder,
	Mutation_createAgendaItem,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteAgendaItem,
	Mutation_deleteEvent,
	Mutation_deleteOrganization,
	Mutation_deleteOrganizationMembership,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

// Helper Types
interface TestUser {
	authToken: string;
	userId: string;
	cleanup: () => Promise<void>;
}
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
				`Admin authentication failed: ${adminSignInResult.errors[0]?.message || "Unknown error"}`,
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
		cachedAdminToken = adminSignInResult.data.signIn.authenticationToken;
		cachedAdminId = adminSignInResult.data.signIn.user.id;
		return { cachedAdminToken, cachedAdminId };
	} catch (error) {
		// Wrap and rethrow with more context
		throw new Error(
			`Failed to get admin authentication token: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

async function createRegularUser(): Promise<TestUser> {
	const { cachedAdminToken: adminAuthToken } = await getAdminAuthTokenAndId();

	const userResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				emailAddress: `email${faker.string.uuid()}@test.com`,
				password: "password123",
				role: "regular",
				name: "Test User",
				isEmailAddressVerified: false,
			},
		},
	});

	// Assert data exists
	assertToBeNonNullish(userResult.data);
	// Assert createUser exists
	assertToBeNonNullish(userResult.data.createUser);
	// Assert user exists and has id
	assertToBeNonNullish(userResult.data.createUser.user);
	assertToBeNonNullish(userResult.data.createUser.user.id);
	// Assert authenticationToken exists
	assertToBeNonNullish(userResult.data.createUser.authenticationToken);

	const userId = userResult.data.createUser.user.id;
	const authToken = userResult.data.createUser.authenticationToken;

	return {
		authToken,
		userId,
		cleanup: async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: userId } },
			});
		},
	};
}

async function createTestAgendaItem(): Promise<TestAgendaItem> {
	const { cachedAdminToken: adminAuthToken } = await getAdminAuthTokenAndId();

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

	// Create event
	const createEventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				name: `Event ${faker.string.uuid()}`,
				organizationId: orgId,
				startAt: new Date().toISOString(),
				endAt: new Date(Date.now() + 86400000).toISOString(),
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
				await mercuriusClient.mutate(Mutation_deleteEvent, {
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
suite("Mutation field deleteAgendaItem", () => {
	suite("Authorization and Authentication", () => {
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
		test("Returns an error if the client is not authenticated", async () => {
			const agendaItemResult = await mercuriusClient.mutate(
				Mutation_deleteAgendaItem,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);
			expect(agendaItemResult.data.deleteAgendaItem).toEqual(null);
			expect(agendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["deleteAgendaItem"],
					}),
				]),
			);
		});

		test("Returns an error if the user is present in the token but not in the database", async () => {
			// create a user
			const regularUser = await createRegularUser();
			testCleanupFunctions.push(regularUser.cleanup);
			// delete the user
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId));

			const agendaItemResult = await mercuriusClient.mutate(
				Mutation_deleteAgendaItem,
				{
					headers: {
						authorization: `bearer ${regularUser.authToken}`,
					},
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);
			expect(agendaItemResult.data.deleteAgendaItem).toEqual(null);
			expect(agendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["deleteAgendaItem"],
					}),
				]),
			);
		});
		test("Returns an error when a non-admin, non-organization member tries to delete an agenda item", async () => {
			const regularUser = await createRegularUser();
			testCleanupFunctions.push(regularUser.cleanup);
			// create a agendaItem
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);
			// delete the agendaItem

			const agendaItemResult = await mercuriusClient.mutate(
				Mutation_deleteAgendaItem,
				{
					headers: {
						authorization: `bearer ${regularUser.authToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
						},
					},
				},
			);
			expect(agendaItemResult.data.deleteAgendaItem).toEqual(null);
			expect(agendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["deleteAgendaItem"],
					}),
				]),
			);
		});
		test("Returns an error when a regular member of the organization tries to delete an agenda item", async () => {
			const regularUser = await createRegularUser();
			testCleanupFunctions.push(regularUser.cleanup);
			// create a agendaItem
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);
			// create organization membership

			const orgMemberShip = await createOrganizationMembership(
				regularUser.authToken,
				regularUser.userId,
				agendaItem.orgId,
			);
			testCleanupFunctions.push(orgMemberShip.cleanup);
			// delete the agendaItem

			const agendaItemResult = await mercuriusClient.mutate(
				Mutation_deleteAgendaItem,
				{
					headers: {
						authorization: `bearer ${regularUser.authToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
						},
					},
				},
			);
			expect(agendaItemResult.data.deleteAgendaItem).toEqual(null);
			expect(agendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["deleteAgendaItem"],
					}),
				]),
			);
		});
		test("Deletes the agenda item successfully when an admin (non-organization member) tries to delete it", async () => {
			const { cachedAdminToken: adminAuthToken } =
				await getAdminAuthTokenAndId();
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);

			// delete the agendaItem

			const agendaItemResult = await mercuriusClient.mutate(
				Mutation_deleteAgendaItem,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
						},
					},
				},
			);
			assertToBeNonNullish(agendaItemResult.data);
			assertToBeNonNullish(agendaItemResult.data.deleteAgendaItem);
			expect(agendaItemResult.data.deleteAgendaItem.id).toEqual(
				agendaItem.agendaItemId,
			);
			expect(agendaItemResult.errors).toBeUndefined();
		});

		test("Deletes the agenda item successfully when an admin (organization member) tries to delete it", async () => {
			const { cachedAdminToken: adminAuthToken, cachedAdminId: adminId } =
				await getAdminAuthTokenAndId();
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);
			// create organization membership
			const orgMemberShip = await createOrganizationMembership(
				adminAuthToken,
				adminId,
				agendaItem.orgId,
			);
			testCleanupFunctions.push(orgMemberShip.cleanup);
			// delete the agendaItem

			const agendaItemResult = await mercuriusClient.mutate(
				Mutation_deleteAgendaItem,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: agendaItem.agendaItemId,
						},
					},
				},
			);
			assertToBeNonNullish(agendaItemResult.data);
			assertToBeNonNullish(agendaItemResult.data.deleteAgendaItem);
			expect(agendaItemResult.data.deleteAgendaItem.id).toEqual(
				agendaItem.agendaItemId,
			);
			expect(agendaItemResult.errors).toBeUndefined();
		});
	});
	suite("Input Validation", () => {
		test("Returns an error when an invalid UUID format is provided", async () => {
			const { cachedAdminToken: adminAuthToken } =
				await getAdminAuthTokenAndId();
			const agendaItemResult = await mercuriusClient.mutate(
				Mutation_deleteAgendaItem,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: "invalid-id",
						},
					},
				},
			);
			expect(agendaItemResult.data.deleteAgendaItem).toEqual(null);
			expect(agendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["deleteAgendaItem"],
					}),
				]),
			);
		});
	});

	suite("Resource Existence", () => {
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
			const { cachedAdminToken: adminAuthToken, cachedAdminId: adminId } =
				await getAdminAuthTokenAndId();
			// create a user
			const agendaItem = await createTestAgendaItem();
			testCleanupFunctions.push(agendaItem.cleanup);
			// create organization membership
			const orgMemberShip = await createOrganizationMembership(
				adminAuthToken,
				adminId,
				agendaItem.orgId,
			);
			testCleanupFunctions.push(orgMemberShip.cleanup);
			// delete the agendaItem
			const agendaItemResult = await mercuriusClient.mutate(
				Mutation_deleteAgendaItem,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);
			expect(agendaItemResult.data.deleteAgendaItem).toEqual(null);
			expect(agendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["deleteAgendaItem"],
					}),
				]),
			);
		});
	});
});
