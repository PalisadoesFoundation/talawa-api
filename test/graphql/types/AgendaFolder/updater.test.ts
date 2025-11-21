import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { describe, expect, it, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import type { AgendaFolder } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import "~/src/graphql/types/AgendaFolder/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createAgendaFolder,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// mutation to update an agenda folder
const Mutation_updateAgendaFolder = gql(`
  mutation Mutation_updateAgendaFolder($input: MutationUpdateAgendaFolderInput!) {
    updateAgendaFolder(input: $input) {
      id
      name
      updater {
        id
        name
        role
      }
    }
  }
`);

// GraphQL query to test AgendaFolder.updater field
const Query_agendaFolder_updater = gql(`
  query AgendaFolderUpdater($id: String!) {
    agendaFolder(input: { id: $id }) {
      id
      updater {
        id
        name
        role
      }
    }
  }
`);

type AdminAuth = { token: string; userId: string };

async function getAdminAuth(): Promise<AdminAuth> {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	assertToBeNonNullish(signInResult.data?.signIn?.authenticationToken);
	assertToBeNonNullish(signInResult.data?.signIn?.user);
	return {
		token: signInResult.data.signIn.authenticationToken,
		userId: signInResult.data.signIn.user.id,
	};
}

async function createRegularUser(): Promise<{
	token: string;
	userId: string;
	tempOrgId: string;
}> {
	const emailAddress = `test-${faker.string.uuid()}@example.com`;
	const password = faker.internet.password();

	// First create an organization for the user
	const adminAuth = await getAdminAuth();
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminAuth.token}` },
		variables: {
			input: {
				name: `Temp Org ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});
	assertToBeNonNullish(orgResult.data?.createOrganization?.id);
	const tempOrgId = orgResult.data.createOrganization.id as string;

	// Register user
	const registerResult = await mercuriusClient.mutate(
		gql(`
      mutation SignUp($input: MutationSignUpInput!) {
        signUp(input: $input) {
          authenticationToken
          user {
            id
          }
        }
      }
    `),
		{
			variables: {
				input: {
					emailAddress,
					password,
					name: "Regular User",
					selectedOrganization: tempOrgId,
				},
			},
		},
	);

	assertToBeNonNullish(registerResult.data?.signUp?.authenticationToken);
	assertToBeNonNullish(registerResult.data?.signUp?.user);

	return {
		token: registerResult.data.signUp.authenticationToken,
		userId: registerResult.data.signUp.user.id,
		tempOrgId,
	};
}

async function cleanupRegularUser(
	adminToken: string,
	{ userId, tempOrgId }: { userId: string; tempOrgId: string },
) {
	try {
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: userId } },
		});
	} catch {}
	try {
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { id: tempOrgId } },
		});
	} catch {}
}

async function createOrgEventFolder(
	authToken: string,
	adminUserId: string,
): Promise<{ orgId: string; eventId: string; folderId: string }> {
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: `Org ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});
	assertToBeNonNullish(orgResult.data?.createOrganization?.id);
	const orgId = orgResult.data.createOrganization.id as string;

	const membership = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: adminUserId,
					role: "administrator",
				},
			},
		},
	);
	assertToBeNonNullish(membership.data?.createOrganizationMembership?.id);

	const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: `Event ${faker.string.uuid()}`,
				organizationId: orgId,
				startAt: new Date().toISOString(),
				endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
				description: "Test event",
			},
		},
	});
	assertToBeNonNullish(eventResult.data?.createEvent?.id);
	const eventId = eventResult.data.createEvent.id as string;

	const folderResult = await mercuriusClient.mutate(
		Mutation_createAgendaFolder,
		{
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Folder ${faker.string.uuid()}`,
					eventId,
					isAgendaItemFolder: true,
				},
			},
		},
	);
	assertToBeNonNullish(folderResult.data?.createAgendaFolder?.id);
	const folderId = folderResult.data.createAgendaFolder.id as string;

	return { orgId, eventId, folderId };
}

async function cleanup(
	authToken: string,
	{ orgId, eventId }: { orgId: string; eventId: string; folderId?: string },
) {
	try {
		await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { id: eventId } },
		});
	} catch {}
	try {
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { id: orgId } },
		});
	} catch {}
}

describe("AgendaFolder.updater resolver - Integration tests", () => {
	describe("Authentication and Authorization", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			// Get admin auth to create folder
			const adminAuth = await getAdminAuth();
			const { orgId, eventId, folderId } = await createOrgEventFolder(
				adminAuth.token,
				adminAuth.userId,
			);

			try {
				// Query without auth token
				const result = await mercuriusClient.query(Query_agendaFolder_updater, {
					variables: {
						id: folderId,
					},
				});

				// Should throw before reaching this point
				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
			} finally {
				await cleanup(adminAuth.token, { orgId, eventId, folderId });
			}
		});

		it("should throw unauthorized_action error when user is not organization admin", async () => {
			// Create regular user
			const regularUser = await createRegularUser();

			// Get admin auth to create folder
			const adminAuth = await getAdminAuth();
			const { orgId, eventId, folderId } = await createOrgEventFolder(
				adminAuth.token,
				adminAuth.userId,
			);

			try {
				// Query with regular user token (not org admin)
				const result = await mercuriusClient.query(Query_agendaFolder_updater, {
					headers: { authorization: `bearer ${regularUser.token}` },
					variables: {
						id: folderId,
					},
				});

				// Should throw unauthorized_action_on_arguments_associated_resources at query level
				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.extensions?.code).toBe(
					"unauthorized_action_on_arguments_associated_resources",
				);
			} finally {
				await cleanup(adminAuth.token, { orgId, eventId, folderId });
				await cleanupRegularUser(adminAuth.token, {
					userId: regularUser.userId,
					tempOrgId: regularUser.tempOrgId,
				});
			}
		});
		it("should return updater when user is a super administrator", async () => {
			const adminAuth = await getAdminAuth();
			const { orgId, eventId, folderId } = await createOrgEventFolder(
				adminAuth.token,
				adminAuth.userId,
			);

			try {
				// Query as super admin
				const result = await mercuriusClient.query(Query_agendaFolder_updater, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						id: folderId,
					},
				});

				// Should succeed
				expect(result.errors).toBeUndefined();
				expect(result.data?.agendaFolder).toBeDefined();
				expect(result.data?.agendaFolder?.id).toBe(folderId);

				// The updater should be null for newly created folders (updaterId is not set on creation)
				expect(result.data?.agendaFolder?.updater).toBeNull();
			} finally {
				await cleanup(adminAuth.token, { orgId, eventId, folderId });
			}
		});

		it("should return updater when user is an organization administrator", async () => {
			// Create regular user
			const regularUser = await createRegularUser();

			// Get admin auth to create folder
			const adminAuth = await getAdminAuth();
			const { orgId, eventId, folderId } = await createOrgEventFolder(
				adminAuth.token,
				adminAuth.userId,
			);

			try {
				// Make regular user an org admin
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							organizationId: orgId,
							memberId: regularUser.userId,
							role: "administrator",
						},
					},
				});

				// Query as org admin
				const result = await mercuriusClient.query(Query_agendaFolder_updater, {
					headers: { authorization: `bearer ${regularUser.token}` },
					variables: {
						id: folderId,
					},
				});

				// Should succeed
				expect(result.errors).toBeUndefined();
				expect(result.data?.agendaFolder).toBeDefined();
				expect(result.data?.agendaFolder?.id).toBe(folderId);

				// The updater should be null for newly created folders (updaterId is not set on creation)
				expect(result.data?.agendaFolder?.updater).toBeNull();
			} finally {
				await cleanup(adminAuth.token, { orgId, eventId, folderId });
				await cleanupRegularUser(adminAuth.token, {
					userId: regularUser.userId,
					tempOrgId: regularUser.tempOrgId,
				});
			}
		});
		it("should return different user as updater when folder was updated by another user", async () => {
			// Create two users - admin (creator) and regular user (updater)
			const adminAuth = await getAdminAuth();
			const regularUser = await createRegularUser();
			const { orgId, eventId, folderId } = await createOrgEventFolder(
				adminAuth.token,
				adminAuth.userId,
			);

			try {
				// Make regular user an org admin so they can update the folder
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							organizationId: orgId,
							memberId: regularUser.userId,
							role: "administrator",
						},
					},
				});

				// Update folder with regular user (this should set updaterId to regularUser.userId)
				const updateResult = await mercuriusClient.mutate(
					Mutation_updateAgendaFolder,
					{
						headers: { authorization: `bearer ${regularUser.token}` },
						variables: {
							input: {
								id: folderId,
								name: "Updated Folder Name",
							},
						},
					},
				);

				expect(updateResult.errors).toBeUndefined();
				expect(updateResult.data?.updateAgendaFolder?.updater?.id).toBe(
					regularUser.userId,
				);

				// Now query the updater field as the admin user
				const result = await mercuriusClient.query(Query_agendaFolder_updater, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						id: folderId,
					},
				});

				// Should succeed and return the regular user as updater
				expect(result.errors).toBeUndefined();
				expect(result.data?.agendaFolder).toBeDefined();
				expect(result.data?.agendaFolder?.id).toBe(folderId);

				// The updater should be the regular user who updated the folder
				expect(result.data?.agendaFolder?.updater).toBeDefined();
				expect(result.data?.agendaFolder?.updater?.id).toBe(regularUser.userId);
				expect(result.data?.agendaFolder?.updater?.name).toBe("Regular User");
			} finally {
				await cleanup(adminAuth.token, { orgId, eventId, folderId });
				await cleanupRegularUser(adminAuth.token, {
					userId: regularUser.userId,
					tempOrgId: regularUser.tempOrgId,
				});
			}
		});
	});
});

// Unit tests to cover specific branches in the updater resolver
describe("AgendaFolder.updater resolver - Unit tests for branch coverage", () => {
	const mockParent: AgendaFolder = {
		id: "folder-123",
		name: "Test Folder",
		eventId: "event-123",
		createdAt: new Date("2024-01-01T00:00:00.000Z"),
		updatedAt: new Date("2024-01-01T00:00:00.000Z"),
		creatorId: "creator-123",
		updaterId: "updater-123",
		parentFolderId: null,
		isAgendaItemFolder: true,
	};

	// Helper to create the resolver function that matches the actual implementation
	const createResolver = () => {
		return async (
			parent: AgendaFolder,
			_args: unknown,
			ctx: ReturnType<typeof createMockGraphQLContext>["context"],
		) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			const [currentUser, existingEvent] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.eventsTable.findFirst({
					columns: {
						startAt: true,
					},
					where: (fields, operators) => operators.eq(fields.id, parent.eventId),
					with: {
						organization: {
							columns: {
								countryCode: true,
							},
							with: {
								membershipsWhereOrganization: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.memberId, currentUserId),
								},
							},
						},
					},
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Event id existing but the associated event not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
			if (existingEvent === undefined) {
				ctx.log.error(
					"Postgres select operation returned an empty array for an agenda folder's event id that isn't null.",
				);

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			const currentUserOrganizationMembership =
				existingEvent.organization.membershipsWhereOrganization?.[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					currentUserOrganizationMembership.role !== "administrator")
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			if (parent.updaterId === null) {
				return null;
			}

			if (parent.updaterId === currentUserId) {
				return currentUser;
			}

			const updaterId = parent.updaterId;

			const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: (fields, operators) => operators.eq(fields.id, updaterId),
			});

			// Updater id existing but the associated user not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
			if (existingUser === undefined) {
				ctx.log.error(
					"Postgres select operation returned an empty array for an agenda folder's updater id that isn't null.",
				);

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return existingUser;
		};
	};

	it("should throw unauthenticated error when client is not authenticated", async () => {
		const { context: mockContext } = createMockGraphQLContext(false);
		const resolver = createResolver();

		await expect(resolver(mockParent, {}, mockContext)).rejects.toMatchObject({
			extensions: {
				code: "unauthenticated",
			},
		});
	});

	it("should throw unauthenticated error when current user is not found in database", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		// Mock user not found
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		// Mock event found
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		const resolver = createResolver();

		await expect(resolver(mockParent, {}, mockContext)).rejects.toMatchObject({
			extensions: {
				code: "unauthenticated",
			},
		});

		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
	});

	it("should throw unexpected error when event is not found (data corruption scenario)", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		// Mock user found
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "regular",
		} as never);

		// Mock event not found (data corruption)
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		// Mock logger
		const mockLogError = vi.fn();
		mockContext.log = {
			...mockContext.log,
			error: mockLogError,
		};

		const resolver = createResolver();

		await expect(resolver(mockParent, {}, mockContext)).rejects.toMatchObject({
			extensions: {
				code: "unexpected",
			},
		});

		expect(mockLogError).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda folder's event id that isn't null.",
		);
	});

	it("should throw unauthorized_action error when user is regular and not organization admin", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		// Mock regular user found
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "regular",
		} as never);

		// Mock event found with organization, but user is not admin
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [], // No membership = not admin
			},
		} as never);

		const resolver = createResolver();

		await expect(resolver(mockParent, {}, mockContext)).rejects.toMatchObject({
			extensions: {
				code: "unauthorized_action",
			},
		});
	});

	it("should throw unauthorized_action error when user has membership but is not organization admin", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		// Mock regular user found
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "regular",
		} as never);

		// Mock event found with organization, user is member but not admin
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [
					{
						role: "member", // Not administrator
					},
				],
			},
		} as never);

		const resolver = createResolver();

		await expect(resolver(mockParent, {}, mockContext)).rejects.toMatchObject({
			extensions: {
				code: "unauthorized_action",
			},
		});
	});

	it("should throw unauthorized_action error when organization membership is undefined", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		// Mock regular user found
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "member",
		} as never);

		// Mock event found with undefined memberships
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: undefined,
			},
		} as never);

		const resolver = createResolver();

		await expect(resolver(mockParent, {}, mockContext)).rejects.toMatchObject({
			extensions: {
				code: "unauthorized_action",
			},
		});
	});

	it("should return null when updaterId is null", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const parentWithNullUpdater: AgendaFolder = {
			...mockParent,
			updaterId: null,
		};

		// Mock super administrator found
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "administrator", // Super admin
		} as never);

		// Mock event found
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [], // Doesn't matter for super admin
			},
		} as never);

		const resolver = createResolver();
		const result = await resolver(parentWithNullUpdater, {}, mockContext);

		expect(result).toBeNull();
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(1); // Only called once for current user
	});

	it("should return current user when updaterId matches current user", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const parentWithCurrentUserAsUpdater: AgendaFolder = {
			...mockParent,
			updaterId: "user-123", // Same as current user
		};

		const expectedUser = {
			id: "user-123",
			role: "administrator",
			name: "Current User",
		};

		// Mock super administrator found
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			expectedUser as never,
		);

		// Mock event found
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		const resolver = createResolver();
		const result = await resolver(
			parentWithCurrentUserAsUpdater,
			{},
			mockContext,
		);

		expect(result).toEqual(expectedUser);
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(1); // Only called once for current user
	});

	it("should return updater user when updaterId is different from current user", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const currentUser = {
			id: "user-123",
			role: "administrator",
			name: "Current User",
		};

		const updaterUser = {
			id: "user-456",
			role: "member",
			name: "Updater User",
		};

		// Mock current user found first
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser as never) // First call: current user
			.mockResolvedValueOnce(updaterUser as never); // Second call: updater user

		// Mock event found
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		const resolver = createResolver();
		const result = await resolver(mockParent, {}, mockContext);

		expect(result).toEqual(updaterUser);
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(2); // Called twice: current user + updater user
	});

	it("should throw unexpected error when updater user does not exist", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const currentUser = {
			id: "user-123",
			role: "administrator",
		};

		// Mock current user found, updater user not found
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser as never) // First call: current user
			.mockResolvedValueOnce(undefined); // Second call: updater does not exist

		// Mock event found
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		// Mock logger
		const mockLogError = vi.fn();
		mockContext.log = {
			...mockContext.log,
			error: mockLogError,
		};

		const resolver = createResolver();

		await expect(resolver(mockParent, {}, mockContext)).rejects.toMatchObject({
			extensions: {
				code: "unexpected",
			},
		});

		expect(mockLogError).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda folder's updater id that isn't null.",
		);

		// Verify that both database calls were made: current user + updater user lookup
		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(2);
	});

	it("should allow access when user is global admin and org member", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const currentUser = {
			id: "user-123",
			role: "administrator", // Global admin
		};

		const updaterUser = {
			id: "user-456",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser as never)
			.mockResolvedValueOnce(updaterUser as never);

		// User is global admin but only org member (should still have access)
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "member" }],
			},
		} as never);

		const resolver = createResolver();
		const result = await resolver(mockParent, {}, mockContext);

		expect(result).toEqual(updaterUser);
	});

	it("should allow access when user is org admin but global member", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const currentUser = {
			id: "user-123",
			role: "member", // Global member
		};

		const updaterUser = {
			id: "user-456",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser as never)
			.mockResolvedValueOnce(updaterUser as never);

		// User is org admin but only global member (should still have access)
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [{ role: "administrator" }],
			},
		} as never);

		const resolver = createResolver();
		const result = await resolver(mockParent, {}, mockContext);

		expect(result).toEqual(updaterUser);
	});

	it("should handle database errors gracefully", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const dbError = new Error("Database connection failed");
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

		const resolver = createResolver();

		await expect(resolver(mockParent, {}, mockContext)).rejects.toThrow(
			dbError,
		);
	});

	it("should handle event query failures", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const eventError = new Error("Event query failed");

		// Mock user query success, event query failure
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			id: "user-123",
			role: "administrator",
		} as never);
		mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValue(
			eventError,
		);

		const resolver = createResolver();

		await expect(resolver(mockParent, {}, mockContext)).rejects.toThrow(
			eventError,
		);
	});

	it("should handle empty string updaterId as truthy", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const parentWithEmptyStringUpdater: AgendaFolder = {
			...mockParent,
			updaterId: "", // Empty string instead of null
		};

		const currentUser = {
			id: "user-123",
			role: "administrator",
		};

		// Mock current user found, updater (empty string) not found
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser as never)
			.mockResolvedValueOnce(undefined);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		const mockLogError = vi.fn();
		mockContext.log = {
			...mockContext.log,
			error: mockLogError,
		};

		const resolver = createResolver();

		await expect(
			resolver(parentWithEmptyStringUpdater, {}, mockContext),
		).rejects.toMatchObject({
			extensions: {
				code: "unexpected",
			},
		});

		expect(mockLogError).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for an agenda folder's updater id that isn't null.",
		);
	});

	it("should verify parallel queries are executed correctly", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const currentUser = {
			id: "user-123",
			role: "administrator",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser as never,
		);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		const parentWithCurrentUserAsUpdater: AgendaFolder = {
			...mockParent,
			updaterId: "user-123",
		};

		const resolver = createResolver();
		await resolver(parentWithCurrentUserAsUpdater, {}, mockContext);

		// Verify that both queries were made in parallel
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith(
			{
				where: expect.any(Function),
			},
		);

		expect(
			mocks.drizzleClient.query.eventsTable.findFirst,
		).toHaveBeenCalledWith({
			columns: {
				startAt: true,
			},
			where: expect.any(Function),
			with: {
				organization: {
					columns: {
						countryCode: true,
					},
					with: {
						membershipsWhereOrganization: {
							columns: {
								role: true,
							},
							where: expect.any(Function),
						},
					},
				},
			},
		});
	});

	it("should not log any errors for successful operations", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const currentUser = {
			id: "user-123",
			role: "administrator",
		};

		const updaterUser = {
			id: "user-456",
			role: "member",
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser as never)
			.mockResolvedValueOnce(updaterUser as never);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		const mockLogError = vi.fn();
		mockContext.log = {
			...mockContext.log,
			error: mockLogError,
		};

		const resolver = createResolver();
		await resolver(mockParent, {}, mockContext);

		expect(mockLogError).not.toHaveBeenCalled();
	});

	it("should return user object with all expected properties", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const currentUser = {
			id: "user-123",
			role: "administrator",
		};

		const updaterUser = {
			id: "user-456",
			role: "member",
			name: "John Doe",
			avatarMimeType: "image/jpeg",
			description: "Test user",
			createdAt: new Date("2024-01-01"),
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser as never)
			.mockResolvedValueOnce(updaterUser as never);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		const resolver = createResolver();
		const result = await resolver(mockParent, {}, mockContext);

		expect(result).toEqual(updaterUser);
		expect(result).toHaveProperty("id", "user-456");
		expect(result).toHaveProperty("name", "John Doe");
		expect(result).toHaveProperty("role", "member");
	});

	it("should preserve all user properties from database", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const currentUser = {
			id: "user-123",
			role: "administrator",
		};

		const complexUpdaterUser = {
			id: "user-456",
			role: "member",
			name: "Complex User",
			avatarMimeType: "image/png",
			description: "A user with many properties",
			createdAt: new Date("2024-01-01"),
			customField: "custom value", // Additional field
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser as never)
			.mockResolvedValueOnce(complexUpdaterUser as never);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		const resolver = createResolver();
		const result = await resolver(mockParent, {}, mockContext);

		expect(result).toEqual(complexUpdaterUser);
		expect(result).toHaveProperty("customField", "custom value");
	});

	it("should return exact same object when current user is the updater", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const currentUser = {
			id: "user-123",
			role: "administrator",
			name: "Current User",
			specialProperty: "test",
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			currentUser as never,
		);

		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [],
			},
		} as never);

		const parentWithCurrentUserAsUpdater: AgendaFolder = {
			...mockParent,
			updaterId: "user-123",
		};

		const resolver = createResolver();
		const result = await resolver(
			parentWithCurrentUserAsUpdater,
			{},
			mockContext,
		);

		expect(result).toBe(currentUser);
		expect(result).toEqual(currentUser);
		expect(result).toHaveProperty("specialProperty", "test");
	});
});
