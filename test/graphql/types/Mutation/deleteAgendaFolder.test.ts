import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
// Import gql to define the mutation inline since it's not in documentNodes yet
import { initGraphQLTada } from "gql.tada";
import { afterEach, expect, suite, test } from "vitest";

import { usersTable } from "~/src/drizzle/schema";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";

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
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Mutation_deleteAgendaFolder = gql(`
  mutation Mutation_deleteAgendaFolder($input: MutationDeleteAgendaFolderInput!) {
    deleteAgendaFolder(input: $input) {
      id
      name
	  description
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
				startAt: new Date().toISOString(),
				endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
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

// This helper function is to make administrator member of an organization
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

suite("Mutation field deleteAgendaFolder", () => {
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
			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.deleteAgendaFolder).toEqual(null);

			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["deleteAgendaFolder"],
					}),
				]),
			);
		});

		test("Returns an error if the user is present in the token but not in the database", async () => {
			const regularUser = await createRegularUserUsingAdmin();

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId));

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data.deleteAgendaFolder).toEqual(null);

			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["deleteAgendaFolder"],
					}),
				]),
			);
		});

		test("Returns an error when a non-member regular user tries to delete a folder", async () => {
			const [{ token: adminAuthToken }, regularUser] = await Promise.all([
				getAdminAuth(),
				createRegularUserUsingAdmin(),
			]);

			const { cleanup, eventId } = await createOrganizationAndEvent(
				adminAuthToken,
				await getAdminUserId(),
			);

			testCleanupFunctions.push(cleanup);

			// Create an agenda folder
			const createFolderResult = await mercuriusClient.mutate(
				Mutation_createAgendaFolder,
				{
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
				},
			);

			assertToBeNonNullish(createFolderResult.data?.createAgendaFolder);
			const folderId = createFolderResult.data.createAgendaFolder.id;

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: folderId,
					},
				},
			});

			expect(result.data.deleteAgendaFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
								{
									code: "unauthorized_action_on_arguments_associated_resources",
									issues: expect.arrayContaining<
										UnauthorizedActionOnArgumentsAssociatedResourcesExtensions["issues"][number]
									>([
										expect.objectContaining({
											argumentPath: ["input", "id"],
										}),
									]),
								},
							),
						message: expect.any(String),
						path: ["deleteAgendaFolder"],
					}),
				]),
			);
		});

		test("Returns an error when an organization member without admin rights tries to delete a folder", async () => {
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

			// Create an agenda folder
			const createFolderResult = await mercuriusClient.mutate(
				Mutation_createAgendaFolder,
				{
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
				},
			);

			assertToBeNonNullish(createFolderResult.data?.createAgendaFolder);
			const folderId = createFolderResult.data.createAgendaFolder.id;

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: folderId,
					},
				},
			});

			expect(result.data.deleteAgendaFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
								{
									code: "unauthorized_action_on_arguments_associated_resources",
									issues: expect.arrayContaining<
										UnauthorizedActionOnArgumentsAssociatedResourcesExtensions["issues"][number]
									>([
										expect.objectContaining({
											argumentPath: ["input", "id"],
										}),
									]),
								},
							),
						message: expect.any(String),
						path: ["deleteAgendaFolder"],
					}),
				]),
			);
		});

		test("Allows super admin to delete folder WITHOUT organization membership", async () => {
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
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
							description: "Test event for super admin bypass",
						},
					},
				},
			);

			assertToBeNonNullish(createEventResult.data?.createEvent);
			const eventId = createEventResult.data.createEvent.id;

			// Create an agenda folder
			const createFolderResult = await mercuriusClient.mutate(
				Mutation_createAgendaFolder,
				{
					headers: { authorization: `bearer ${regularUser.authToken}` },
					variables: {
						input: {
							name: "Super Admin Global Access Folder",
							eventId,
							isAgendaItemFolder: false,
						},
					},
				},
			);

			assertToBeNonNullish(createFolderResult.data?.createAgendaFolder);
			const folderId = createFolderResult.data.createAgendaFolder.id;

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

			// Execute Mutation: Super Admin attempts to delete the folder
			// Note: The Admin is NOT a member of the organization, validating the global role bypass
			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						id: folderId,
					},
				},
			});

			// Verify the folder was deleted successfully
			assertToBeNonNullish(result.data?.deleteAgendaFolder);
			expect(result.data.deleteAgendaFolder.id).toEqual(folderId);
			expect(result.data.deleteAgendaFolder.name).toEqual(
				"Super Admin Global Access Folder",
			);
			expect(result.errors).toBeUndefined();
		});

		test("Allows organization admin to delete folder", async () => {
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
				role: "administrator",
			});

			// Create an agenda folder
			const createFolderResult = await mercuriusClient.mutate(
				Mutation_createAgendaFolder,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							name: "Org Admin Folder",
							eventId,
							isAgendaItemFolder: false,
						},
					},
				},
			);

			assertToBeNonNullish(createFolderResult.data?.createAgendaFolder);
			const folderId = createFolderResult.data.createAgendaFolder.id;

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: {
					authorization: `bearer ${regularUser.authToken}`,
				},
				variables: {
					input: {
						id: folderId,
					},
				},
			});

			assertToBeNonNullish(result.data?.deleteAgendaFolder);
			expect(result.data.deleteAgendaFolder.id).toEqual(folderId);
			expect(result.data.deleteAgendaFolder.name).toEqual("Org Admin Folder");
			expect(result.errors).toBeUndefined();
		});
	});

	suite("Input Validation", () => {
		test("Returns an error when invalid arguments are provided", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: "not-a-valid-uuid",
					},
				},
			});

			expect(result.data?.deleteAgendaFolder ?? null).toEqual(null);

			// Invalid ID can be rejected at either GraphQL type validation layer or resolver layer
			expect(result.errors).toBeDefined();
			expect(
				result.errors?.some(
					(error) =>
						error.extensions?.code === "invalid_arguments" ||
						error.message.includes("got invalid value") ||
						error.message.includes("ID cannot represent") ||
						error.message.includes("Expected ID"),
				),
			).toBe(true);
		});
	});

	suite("Resource Existence", () => {
		test("Returns an error when agenda folder does not exist", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data.deleteAgendaFolder).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
								{
									code: "arguments_associated_resources_not_found",
									issues: expect.arrayContaining<
										ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
									>([
										expect.objectContaining({
											argumentPath: ["input", "id"],
										}),
									]),
								},
							),
						message: expect.any(String),
						path: ["deleteAgendaFolder"],
					}),
				]),
			);
		});
	});

	suite("Successful Deletion", () => {
		test("Deletes agenda folder successfully when admin user deletes it", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				adminAuthToken,
				await getAdminUserId(),
			);

			testCleanupFunctions.push(cleanup);

			// Create an agenda folder
			const createFolderResult = await mercuriusClient.mutate(
				Mutation_createAgendaFolder,
				{
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
				},
			);

			assertToBeNonNullish(createFolderResult.data?.createAgendaFolder);
			const folderId = createFolderResult.data.createAgendaFolder.id;

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: folderId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.deleteAgendaFolder);
			expect(result.data.deleteAgendaFolder.id).toEqual(folderId);
			expect(result.data.deleteAgendaFolder.name).toEqual("Test Folder");
			expect(result.data.deleteAgendaFolder.isAgendaItemFolder).toEqual(true);
		});

		test("Deletes agenda folder with parent folder successfully", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				adminAuthToken,
				await getAdminUserId(),
			);

			testCleanupFunctions.push(cleanup);

			// Create parent folder
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

			// Create child folder
			const createChildFolderResult = await mercuriusClient.mutate(
				Mutation_createAgendaFolder,
				{
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
				},
			);

			assertToBeNonNullish(createChildFolderResult.data?.createAgendaFolder);
			const childFolderId = createChildFolderResult.data.createAgendaFolder.id;

			const result = await mercuriusClient.mutate(Mutation_deleteAgendaFolder, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: childFolderId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.deleteAgendaFolder);
			expect(result.data.deleteAgendaFolder.id).toEqual(childFolderId);
			expect(result.data.deleteAgendaFolder.name).toEqual("Child Folder");
			expect(result.data.deleteAgendaFolder.isAgendaItemFolder).toEqual(false);
		});
	});

	suite("Edge Cases", () => {
		test("Returns an error when trying to delete the same folder twice", async () => {
			const { token: adminAuthToken } = await getAdminAuth();

			const { cleanup, eventId } = await createOrganizationAndEvent(
				adminAuthToken,
				await getAdminUserId(),
			);

			testCleanupFunctions.push(cleanup);

			// Create an agenda folder
			const createFolderResult = await mercuriusClient.mutate(
				Mutation_createAgendaFolder,
				{
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
				},
			);

			assertToBeNonNullish(createFolderResult.data?.createAgendaFolder);
			const folderId = createFolderResult.data.createAgendaFolder.id;

			// First deletion
			const firstDeleteResult = await mercuriusClient.mutate(
				Mutation_deleteAgendaFolder,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: folderId,
						},
					},
				},
			);

			expect(firstDeleteResult.errors).toBeUndefined();
			assertToBeNonNullish(firstDeleteResult.data?.deleteAgendaFolder);

			// Second deletion attempt
			const secondDeleteResult = await mercuriusClient.mutate(
				Mutation_deleteAgendaFolder,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: folderId,
						},
					},
				},
			);

			expect(secondDeleteResult.data.deleteAgendaFolder).toEqual(null);
			expect(secondDeleteResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
								{
									code: "arguments_associated_resources_not_found",
									issues: expect.arrayContaining<
										ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
									>([
										expect.objectContaining({
											argumentPath: ["input", "id"],
										}),
									]),
								},
							),
						message: expect.any(String),
						path: ["deleteAgendaFolder"],
					}),
				]),
			);
		});
	});
});
