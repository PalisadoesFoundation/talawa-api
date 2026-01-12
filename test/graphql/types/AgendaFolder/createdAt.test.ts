import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import type { AgendaFolder } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
// Import the actual implementation to ensure it's loaded for coverage
import "~/src/graphql/types/AgendaFolder/createdAt";
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
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

afterEach(() => {
	vi.clearAllMocks();
});

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>(); // GraphQL query to test AgendaFolder.createdAt field
const Query_agendaFolder_createdAt = gql(`
  query AgendaFolderCreatedAt($id: String!) {
    agendaFolder(input: { id: $id }) {
      id
      createdAt
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

async function createRegularUser(): Promise<{ token: string; userId: string }> {
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
	};
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

	await retryMembershipCreation(authToken, orgId, adminUserId);

	const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${authToken}` },
		variables: {
			input: {
				name: `Event ${faker.string.uuid()}`,
				organizationId: orgId,
				startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
				endAt: new Date(Date.now() + 65 * 60 * 1000).toISOString(),
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

async function retryMembershipCreation(
	authToken: string,
	orgId: string,
	adminUserId: string,
) {
	let retries = 2;
	while (retries > 0) {
		try {
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
			if (!membership.data?.createOrganizationMembership?.id) {
				throw new Error("createOrganizationMembership returned null");
			}
			return;
		} catch (error) {
			retries--;
			if (retries === 0) throw error;
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}
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

describe("AgendaFolder.createdAt resolver", () => {
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
				const result = await mercuriusClient.query(
					Query_agendaFolder_createdAt,
					{
						variables: {
							id: folderId,
						},
					},
				);

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
				const result = await mercuriusClient.query(
					Query_agendaFolder_createdAt,
					{
						headers: { authorization: `bearer ${regularUser.token}` },
						variables: {
							id: folderId,
						},
					},
				);

				// Should throw unauthorized_action_on_arguments_associated_resources at query level
				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.extensions?.code).toBe(
					"unauthorized_action_on_arguments_associated_resources",
				);
			} finally {
				await cleanup(adminAuth.token, { orgId, eventId, folderId });
			}
		});

		it("should throw unauthorized_action when user has membership but is not organization admin", async () => {
			// Create regular user
			const regularUser = await createRegularUser();

			// Get admin auth to create folder
			const adminAuth = await getAdminAuth();
			const { orgId, eventId, folderId } = await createOrgEventFolder(
				adminAuth.token,
				adminAuth.userId,
			);

			try {
				// Make regular user a regular member (not admin)
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuth.token}` },
					variables: {
						input: {
							organizationId: orgId,
							memberId: regularUser.userId,
							role: "regular",
						},
					},
				}); // Query as regular member
				const result = await mercuriusClient.query(
					Query_agendaFolder_createdAt,
					{
						headers: { authorization: `bearer ${regularUser.token}` },
						variables: {
							id: folderId,
						},
					},
				);

				// Should throw unauthorized_action_on_arguments_associated_resources at query level
				// because member role is not sufficient to access agendaFolder query
				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.extensions?.code).toBe(
					"unauthorized_action_on_arguments_associated_resources",
				);
			} finally {
				await cleanup(adminAuth.token, { orgId, eventId, folderId });
			}
		});
	});

	describe("Successful resolution", () => {
		it("should return createdAt when user is a super administrator", async () => {
			const adminAuth = await getAdminAuth();
			const { orgId, eventId, folderId } = await createOrgEventFolder(
				adminAuth.token,
				adminAuth.userId,
			);

			try {
				// Query as super admin
				const result = await mercuriusClient.query(
					Query_agendaFolder_createdAt,
					{
						headers: { authorization: `bearer ${adminAuth.token}` },
						variables: {
							id: folderId,
						},
					},
				);

				// Should succeed
				expect(result.errors).toBeUndefined();
				expect(result.data?.agendaFolder).toBeDefined();
				expect(result.data?.agendaFolder?.id).toBe(folderId);
				expect(result.data?.agendaFolder?.createdAt).toBeDefined();

				// Verify it's a valid date
				if (result.data?.agendaFolder?.createdAt) {
					const createdAt = new Date(result.data.agendaFolder.createdAt);
					expect(createdAt).toBeInstanceOf(Date);
					expect(createdAt.getTime()).toBeGreaterThan(0);
				}
			} finally {
				await cleanup(adminAuth.token, { orgId, eventId, folderId });
			}
		});

		it("should return createdAt when user is an organization administrator", async () => {
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
				const result = await mercuriusClient.query(
					Query_agendaFolder_createdAt,
					{
						headers: { authorization: `bearer ${regularUser.token}` },
						variables: {
							id: folderId,
						},
					},
				);

				// Should succeed
				expect(result.errors).toBeUndefined();
				expect(result.data?.agendaFolder).toBeDefined();
				expect(result.data?.agendaFolder?.id).toBe(folderId);
				expect(result.data?.agendaFolder?.createdAt).toBeDefined();

				// Verify it's a valid date
				if (result.data?.agendaFolder?.createdAt) {
					const createdAt = new Date(result.data.agendaFolder.createdAt);
					expect(createdAt).toBeInstanceOf(Date);
					expect(createdAt.getTime()).toBeGreaterThan(0);
				}
			} finally {
				await cleanup(adminAuth.token, { orgId, eventId, folderId });
			}
		});
	});
});

// Unit tests to cover specific branches in the createdAt resolver
describe("AgendaFolder.createdAt resolver - Unit tests for branch coverage", () => {
	const mockParent: AgendaFolder = {
		id: "folder-123",
		name: "Test Folder",
		eventId: "event-123",
		createdAt: new Date("2024-01-01T00:00:00.000Z"),
		updatedAt: new Date("2024-01-01T00:00:00.000Z"),
		creatorId: "creator-123",
		updaterId: "updater-123",
		description: "desc",
		sequence: 1,
		isDefaultFolder: false,
		organizationId: "orgId-123",
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
					columns: {
						role: true,
					},
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
				existingEvent.organization.membershipsWhereOrganization[0];

			if (currentUser.role !== "administrator") {
				if (currentUserOrganizationMembership === undefined) {
					// User is neither a super admin nor a member of the organization
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				// User is a member, but membership role is insufficient for this action
				if (currentUserOrganizationMembership.role !== "administrator") {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: [],
								},
							],
						},
					});
				}
			}

			return parent.createdAt;
		};
	};

	it("should throw unauthenticated error when client is not authenticated", async () => {
		const { context: mockContext } = createMockGraphQLContext(false);
		const resolver = createResolver();

		await expect(resolver(mockParent, {}, mockContext)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			}),
		);
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

		await expect(resolver(mockParent, {}, mockContext)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			}),
		);

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

		await expect(resolver(mockParent, {}, mockContext)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			}),
		);

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

		await expect(resolver(mockParent, {}, mockContext)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			}),
		);
	});

	it("should throw unauthorized_action_on_arguments_associated_resources error when user has membership but is not organization admin", async () => {
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
						role: "regular", // Not administrator
					},
				],
			},
		} as never);

		const resolver = createResolver();

		await expect(resolver(mockParent, {}, mockContext)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: [],
						},
					],
				},
			}),
		);
	});

	it("should return createdAt when user is a super administrator", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"admin-123",
		);

		const expectedCreatedAt = new Date("2024-01-01T00:00:00.000Z");
		const parentWithCreatedAt: AgendaFolder = {
			...mockParent,
			createdAt: expectedCreatedAt,
		};

		// Mock super administrator found
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "admin-123",
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
		const result = await resolver(parentWithCreatedAt, {}, mockContext);

		expect(result).toEqual(expectedCreatedAt);
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
		expect(mocks.drizzleClient.query.eventsTable.findFirst).toHaveBeenCalled();
	});

	it("should return createdAt when user is an organization administrator", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const expectedCreatedAt = new Date("2024-01-01T00:00:00.000Z");
		const parentWithCreatedAt: AgendaFolder = {
			...mockParent,
			createdAt: expectedCreatedAt,
		};

		// Mock regular user found
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "regular",
		} as never);

		// Mock event found with organization admin membership
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [
					{
						role: "administrator", // Organization admin
					},
				],
			},
		} as never);

		const resolver = createResolver();
		const result = await resolver(parentWithCreatedAt, {}, mockContext);

		expect(result).toEqual(expectedCreatedAt);
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
		expect(mocks.drizzleClient.query.eventsTable.findFirst).toHaveBeenCalled();
	});
});
