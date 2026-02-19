import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import type { AgendaFolder } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
// Import the actual resolver function for testing
import { resolveUpdatedAt } from "~/src/graphql/types/AgendaFolder/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "../../../_Mocks_/mockContextCreator/mockContextCreator";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createAgendaFolder,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Query_currentUser,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

afterEach(() => {
	vi.clearAllMocks();
});

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// GraphQL query to test AgendaFolder.updatedAt field
const Query_agendaFolder_updatedAt = gql(`
  query AgendaFolderUpdatedAt($id: String!) {
    agendaFolder(input: { id: $id }) {
      id
      updatedAt
    }
  }
`);

type AdminAuth = { token: string; userId: string };
async function getAdminAuth(): Promise<AdminAuth> {
	const { accessToken } = await getAdminAuthViaRest(server);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${accessToken}` },
	});
	const userId = currentUserResult.data?.currentUser?.id;
	assertToBeNonNullish(accessToken);
	assertToBeNonNullish(userId);
	return { token: accessToken, userId };
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
					organizationId: orgId,
					sequence: 1,
					description: "Test agenda folder",
				},
			},
		},
	);
	assertToBeNonNullish(folderResult.data?.createAgendaFolder?.id);
	const folderId = folderResult.data.createAgendaFolder.id as string;

	return { orgId, eventId, folderId };
}

// Retry configuration for membership creation to handle race conditions
// Higher retry count (5) is chosen because membership creation can be flaky due to:
// - Database transaction timing issues
// - Concurrent test execution
// - Transient network/connection issues
// Exponential backoff helps reduce database load on retries
const MEMBERSHIP_RETRY_COUNT = 5;
const MEMBERSHIP_INITIAL_BACKOFF_MS = 500;

async function retryMembershipCreation(
	authToken: string,
	orgId: string,
	adminUserId: string,
) {
	let retries = MEMBERSHIP_RETRY_COUNT;
	let backoffMs = MEMBERSHIP_INITIAL_BACKOFF_MS;

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
			if (retries === 0) {
				// All retries exhausted, throw the error
				throw error;
			}
			// Exponential backoff: double the wait time on each retry
			await new Promise((resolve) => setTimeout(resolve, backoffMs));
			backoffMs *= 2;
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
	} catch (err) {
		console.error("Teardown failed deleting standalone event", {
			id: eventId,
			err,
		});
	}
	try {
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { id: orgId } },
		});
	} catch (err) {
		console.error("Teardown failed deleting organization", { id: orgId, err });
	}
}

describe("AgendaFolder.updatedAt resolver", () => {
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
					Query_agendaFolder_updatedAt,
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
					Query_agendaFolder_updatedAt,
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
				});

				// Query as regular member
				const result = await mercuriusClient.query(
					Query_agendaFolder_updatedAt,
					{
						headers: { authorization: `bearer ${regularUser.token}` },
						variables: {
							id: folderId,
						},
					},
				);

				// Should throw unauthorized_action when member is not org admin
				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.extensions?.code).toBe(
					"unauthorized_action",
				);
			} finally {
				await cleanup(adminAuth.token, { orgId, eventId, folderId });
			}
		});
	});

	describe("Successful resolution", () => {
		it("should return updatedAt when user is a super administrator", async () => {
			const adminAuth = await getAdminAuth();
			const { orgId, eventId, folderId } = await createOrgEventFolder(
				adminAuth.token,
				adminAuth.userId,
			);

			try {
				// Query as super admin
				const result = await mercuriusClient.query(
					Query_agendaFolder_updatedAt,
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
				expect(result.data?.agendaFolder?.updatedAt).toBeDefined();

				// Verify it's a valid date
				if (result.data?.agendaFolder?.updatedAt) {
					const updatedAt = new Date(result.data.agendaFolder.updatedAt);
					expect(updatedAt).toBeInstanceOf(Date);
					expect(updatedAt.getTime()).toBeGreaterThan(0);
				}
			} finally {
				await cleanup(adminAuth.token, { orgId, eventId, folderId });
			}
		});

		it("should return updatedAt when user is an organization administrator", async () => {
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
					Query_agendaFolder_updatedAt,
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
				expect(result.data?.agendaFolder?.updatedAt).toBeDefined();

				// Verify it's a valid date
				if (result.data?.agendaFolder?.updatedAt) {
					const updatedAt = new Date(result.data.agendaFolder.updatedAt);
					expect(updatedAt).toBeInstanceOf(Date);
					expect(updatedAt.getTime()).toBeGreaterThan(0);
				}
			} finally {
				await cleanup(adminAuth.token, { orgId, eventId, folderId });
			}
		});
	});
});

// Unit tests to cover specific branches in the updatedAt resolver
describe("AgendaFolder.updatedAt resolver - Unit tests for branch coverage", () => {
	const mockParent: AgendaFolder = {
		id: "folder-123",
		name: "Test Folder",
		description: null,
		eventId: "event-123",
		organizationId: "org-123",
		sequence: 1,
		isDefaultFolder: false,
		createdAt: new Date("2024-01-01T00:00:00.000Z"),
		updatedAt: new Date("2024-01-02T00:00:00.000Z"),
		creatorId: "creator-123",
		updaterId: "updater-123",
	};

	// Note: We test the actual resolver function imported from the source file
	// rather than duplicating the implementation, ensuring we test production code

	it("should throw unauthenticated error when client is not authenticated", async () => {
		const { context: mockContext } = createMockGraphQLContext(false);

		await expect(resolveUpdatedAt(mockParent, {}, mockContext)).rejects.toThrow(
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

		await expect(resolveUpdatedAt(mockParent, {}, mockContext)).rejects.toThrow(
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

		await expect(resolveUpdatedAt(mockParent, {}, mockContext)).rejects.toThrow(
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

	it("should throw unauthorized_action error when user is regular and not organization member", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		// Mock regular user found
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: "user-123",
			role: "regular",
		} as never);

		// Mock event found with organization, but user is not a member
		mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValueOnce({
			id: "event-123",
			startAt: new Date("2024-01-15T10:00:00.000Z"),
			organization: {
				countryCode: "US",
				membershipsWhereOrganization: [], // No membership
			},
		} as never);

		await expect(resolveUpdatedAt(mockParent, {}, mockContext)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			}),
		);
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
						role: "regular", // Not administrator
					},
				],
			},
		} as never);

		await expect(resolveUpdatedAt(mockParent, {}, mockContext)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: {
					code: "unauthorized_action",
				},
			}),
		);
	});

	it("should return updatedAt when user is a super administrator", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"admin-123",
		);

		const expectedUpdatedAt = new Date("2024-01-02T00:00:00.000Z");
		const parentWithUpdatedAt: AgendaFolder = {
			...mockParent,
			updatedAt: expectedUpdatedAt,
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

		const result = await resolveUpdatedAt(parentWithUpdatedAt, {}, mockContext);

		expect(result).toEqual(expectedUpdatedAt);
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
		expect(mocks.drizzleClient.query.eventsTable.findFirst).toHaveBeenCalled();
	});

	it("should return updatedAt when user is an organization administrator", async () => {
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		const expectedUpdatedAt = new Date("2024-01-02T00:00:00.000Z");
		const parentWithUpdatedAt: AgendaFolder = {
			...mockParent,
			updatedAt: expectedUpdatedAt,
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

		const result = await resolveUpdatedAt(parentWithUpdatedAt, {}, mockContext);

		expect(result).toEqual(expectedUpdatedAt);
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
		expect(mocks.drizzleClient.query.eventsTable.findFirst).toHaveBeenCalled();
	});
});
