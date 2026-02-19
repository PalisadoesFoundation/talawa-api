import { faker } from "@faker-js/faker";
import { beforeAll, beforeEach, expect, suite, test, vi } from "vitest";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_inviteEventAttendee,
	Mutation_registerForEvent,
	Query_currentUser,
	Query_eventsByOrganizationId,
	Query_usersByIds,
	Query_usersByOrganizationId,
} from "../documentNodes";

const MOCK_ORG_ID = "mock-org-id";

async function globalSignInAndGetToken() {
	const { accessToken: authToken } = await getAdminAuthViaRest(server);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${authToken}` },
	});
	const userId = currentUserResult.data?.currentUser?.id;
	assertToBeNonNullish(authToken);
	assertToBeNonNullish(userId);
	return { authToken, userId };
}

// Creates a user and returns its token and id.
async function createUserAndGetToken(userDetails = {}) {
	const defaultUser = {
		name: faker.person.fullName(),
		emailAddress: faker.internet.email(),
		password: faker.internet.password({ length: 12 }),
		role: "regular" as const,
		isEmailAddressVerified: false,
		workPhoneNumber: null,
		state: null,
		postalCode: null,
		naturalLanguageCode: "en" as const,
		addressLine1: null,
		addressLine2: null,
	};
	const input = { ...defaultUser, ...userDetails };
	const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
		// Use the global admin token to create users so that the mutation is authenticated.
		headers: { authorization: `bearer ${globalAuth.authToken}` },
		variables: { input },
	});
	const authToken = createUserResult.data?.createUser?.authenticationToken;
	assertToBeNonNullish(authToken);
	const userId = createUserResult.data?.createUser?.user?.id;
	assertToBeNonNullish(userId);
	return { authToken, userId };
}

// Creates an organization using the given token.
// If creation fails (e.g. due to unauthorized_action), fall back to a mock org id.
async function safeCreateOrganizationAndGetId(
	authToken: string,
): Promise<string> {
	try {
		const uniqueName = `Test Org ${faker.string.uuid()}`;
		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: uniqueName,
					description: "Organization for testing",
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "123 Market St",
					addressLine2: "Suite 100",
				},
			},
		});
		if (!result.data?.createOrganization?.id) {
			console.error("createOrganization failed:", result.errors);
			throw new Error("Organization creation failed");
		}
		const orgId = result.data.createOrganization.id;
		return orgId;
	} catch (error) {
		// If creation fails (for example, unauthorized_action), use a fallback id.
		console.warn("Falling back to MOCK_ORG_ID due to error:", error);
		return MOCK_ORG_ID;
	}
}

async function addMembership(
	organizationId: string,
	memberId: string,
	role: "administrator" | "regular",
) {
	await server.drizzleClient
		.insert(organizationMembershipsTable)
		.values({
			organizationId, // Use the table's expected key (assuming it's camelCase here)
			memberId,
			role,
		})
		.execute();
}

// --- Global Variables for Tests ---
let globalAuth: { authToken: string; userId: string };

// Before running any query tests, sign in as admin.
beforeAll(async () => {
	globalAuth = await globalSignInAndGetToken();
});

//
// TESTS FOR QUERY: usersByIds
//
suite("Query: usersByIds", () => {
	let authToken: string;
	let user1Id: string;
	let user2Id: string;

	beforeEach(async () => {
		// Create two additional users.
		const user1 = await createUserAndGetToken();
		const user2 = await createUserAndGetToken();
		user1Id = user1.userId;
		user2Id = user2.userId;
		authToken = globalAuth.authToken;
	});

	test("should return an error if input is invalid", async () => {
		const result = await mercuriusClient.query(Query_usersByIds, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { ids: [] } },
		});
		expect(result.data?.usersByIds).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
				}),
			]),
		);
	});

	test("should return users for valid ids", async () => {
		const result = await mercuriusClient.query(Query_usersByIds, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { ids: [user1Id, user2Id] } },
		});
		expect(result.errors).toBeUndefined();
		const users = result.data?.usersByIds;
		expect(users).toBeInstanceOf(Array);
		const returnedIds = (users as Array<{ id: string }>).map((u) => u.id);
		expect(returnedIds).toEqual(expect.arrayContaining([user1Id, user2Id]));
	});

	test("should return unauthenticated error if not signed in", async () => {
		const result = await mercuriusClient.query(Query_usersByIds, {
			variables: { input: { ids: [user1Id] } },
		});
		expect(result.data?.usersByIds).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["usersByIds"],
				}),
			]),
		);
	});
});

//
// TESTS FOR QUERY: usersByOrganizationId
//
suite("Query: usersByOrganizationId", () => {
	let orgId: string;
	let memberUserId: string;

	beforeEach(async () => {
		// Create an organization.
		orgId = await safeCreateOrganizationAndGetId(globalAuth.authToken);
		// Create a member user and add membership.
		const memberUser = await createUserAndGetToken();
		memberUserId = memberUser.userId;
		await addMembership(orgId, memberUserId, "regular");
	});

	test("should return an empty array if no memberships exist", async () => {
		const randomOrgId = faker.string.uuid();
		const result = await mercuriusClient.query(Query_usersByOrganizationId, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: { organizationId: randomOrgId },
		});
		expect(result.errors).toBeUndefined();
		expect(result.data?.usersByOrganizationId).toEqual([]);
	});

	test("should return all users that belong to the organization", async () => {
		const result = await mercuriusClient.query(Query_usersByOrganizationId, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: { organizationId: orgId },
		});
		expect(result.errors).toBeUndefined();
		const users = result.data?.usersByOrganizationId;
		expect(users).toBeInstanceOf(Array);
		const returnedIds = (users as Array<{ id: string }>).map((u) => u.id);
		expect(returnedIds).toContain(memberUserId);
	});

	test("should handle database errors gracefully", async () => {
		// Mock a database error using vi.spyOn for proper typing
		const spy = vi
			.spyOn(
				server.drizzleClient.query.organizationMembershipsTable,
				"findMany",
			)
			.mockImplementation(() => {
				throw new Error("Database connection error");
			});

		try {
			const result = await mercuriusClient.query(Query_usersByOrganizationId, {
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: { organizationId: orgId },
			});

			expect(result.errors).toBeDefined();
			expect(result.data?.usersByOrganizationId).toBeNull();
			expect(result.errors?.[0]?.message).toContain(
				"An error occurred while fetching users",
			);
		} finally {
			// Restore the spy
			spy.mockRestore();
		}
	});
});

//
// TESTS FOR QUERY: eventsByOrganizationId
//
suite("Query: eventsByOrganizationId", () => {
	let orgId: string;

	beforeEach(async () => {
		// Create an organization.
		orgId = await safeCreateOrganizationAndGetId(globalAuth.authToken);
		// Ensure admin user is a member of the organization so they can create events
		try {
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: globalAuth.userId,
						role: "administrator",
					},
				},
			});
		} catch (_error) {
			console.error(_error);
		}
	});

	test("should return unauthenticated error if not signed in", async () => {
		// Query without auth token
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			variables: { input: { organizationId: orgId } },
		});

		// Expect the data field to be null when not authenticated.
		expect(result.data?.eventsByOrganizationId).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["eventsByOrganizationId"],
				}),
			]),
		);
	});

	test("should return an error for invalid input", async () => {
		// Query with an invalid organizationId (not a valid UUID)
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: { input: { organizationId: "invalid-uuid" } },
		});

		// Expect the data field to be null for invalid input.
		expect(result.data?.eventsByOrganizationId).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
					path: ["eventsByOrganizationId"],
				}),
			]),
		);
	});

	test("should return an empty array if no events exist", async () => {
		// Query with a valid organizationId that has no events.
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: { input: { organizationId: orgId } },
		});

		// Expect no errors and data to be an empty array.
		expect(result.errors).toBeUndefined();
		expect(result.data?.eventsByOrganizationId).toEqual([]);
	});

	test("should return unauthenticated error when currentUser is undefined", async () => {
		// Mock findFirst to return undefined using vi.spyOn for proper typing
		const spy = vi
			.spyOn(server.drizzleClient.query.usersTable, "findFirst")
			.mockResolvedValue(undefined);

		try {
			const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: { input: { organizationId: orgId } },
			});

			expect(result.data?.eventsByOrganizationId).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["eventsByOrganizationId"],
					}),
				]),
			);
		} finally {
			// Restore the spy
			spy.mockRestore();
		}
	});

	test("should handle database errors when fetching events", async () => {
		// Mock eventsTable.findMany to throw an error using vi.spyOn for proper typing
		const spy = vi
			.spyOn(server.drizzleClient.query.eventsTable, "findMany")
			.mockImplementation(() => {
				throw new Error("Database query failed");
			});

		try {
			const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: { input: { organizationId: orgId } },
			});

			expect(result.errors).toBeDefined();
			expect(result.data?.eventsByOrganizationId).toBeNull();
			expect(result.errors?.[0]?.message).toContain(
				"An error occurred while fetching events",
			);
		} finally {
			// Restore the spy
			spy.mockRestore();
		}
	});

	test("should return public events to all organization members", async () => {
		// Create a regular user and add to organization
		const regularUser = await createUserAndGetToken();
		await addMembership(orgId, regularUser.userId, "regular");

		// Create a public event
		const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
		const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						name: "Public Event",
						description: "A public event",
						organizationId: orgId,
						startAt,
						endAt,
						isPublic: true,
						isInviteOnly: false,
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		const publicEventId = createEventResult.data.createEvent.id;

		// Query as regular user - should see public event
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: { input: { organizationId: orgId } },
		});

		expect(result.errors).toBeUndefined();
		const events = result.data?.eventsByOrganizationId;
		expect(events).toBeInstanceOf(Array);
		expect(events?.length).toBeGreaterThan(0);
		const eventIds = (events as Array<{ id: string }>).map((e) => e.id);
		expect(eventIds).toContain(publicEventId);
	});

	test("should show invite-only events to event creator", async () => {
		// Create an invite-only event as admin (creator)
		const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
		const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						name: "Invite-Only Event",
						description: "An invite-only event",
						organizationId: orgId,
						startAt,
						endAt,
						isInviteOnly: true,
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		const inviteOnlyEventId = createEventResult.data.createEvent.id;

		// Query as creator (admin) - should see invite-only event
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: { input: { organizationId: orgId } },
		});

		expect(result.errors).toBeUndefined();
		const events = result.data?.eventsByOrganizationId;
		expect(events).toBeInstanceOf(Array);
		const eventIds = (events as Array<{ id: string }>).map((e) => e.id);
		expect(eventIds).toContain(inviteOnlyEventId);
	});

	test("should show invite-only events to organization administrators", async () => {
		// Create an admin user and add to organization
		const adminUser = await createUserAndGetToken({ role: "administrator" });
		await addMembership(orgId, adminUser.userId, "administrator");

		// Create an invite-only event (not created by this admin)
		const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
		const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						name: "Invite-Only Event for Admin",
						description: "An invite-only event",
						organizationId: orgId,
						startAt,
						endAt,
						isInviteOnly: true,
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		const inviteOnlyEventId = createEventResult.data.createEvent.id;

		// Query as organization admin - should see invite-only event
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			headers: { authorization: `bearer ${adminUser.authToken}` },
			variables: { input: { organizationId: orgId } },
		});

		expect(result.errors).toBeUndefined();
		const events = result.data?.eventsByOrganizationId;
		expect(events).toBeInstanceOf(Array);
		const eventIds = (events as Array<{ id: string }>).map((e) => e.id);
		expect(eventIds).toContain(inviteOnlyEventId);
	});

	test("should show invite-only events to invited users", async () => {
		// Create a regular user and add to organization
		const regularUser = await createUserAndGetToken();
		await addMembership(orgId, regularUser.userId, "regular");

		// Create an invite-only event
		const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
		const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						name: "Invite-Only Event",
						description: "An invite-only event",
						organizationId: orgId,
						startAt,
						endAt,
						isInviteOnly: true,
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		const inviteOnlyEventId = createEventResult.data.createEvent.id;

		// Invite the regular user to the event
		await mercuriusClient.mutate(Mutation_inviteEventAttendee, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				data: {
					eventId: inviteOnlyEventId,
					userId: regularUser.userId,
				},
			},
		});

		// Query as invited user - should see invite-only event
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: { input: { organizationId: orgId } },
		});

		expect(result.errors).toBeUndefined();
		const events = result.data?.eventsByOrganizationId;
		expect(events).toBeInstanceOf(Array);
		const eventIds = (events as Array<{ id: string }>).map((e) => e.id);
		expect(eventIds).toContain(inviteOnlyEventId);
	});

	test("should show invite-only events to registered-but-not-invited users", async () => {
		// Create a regular user and add to organization
		const regularUser = await createUserAndGetToken();
		await addMembership(orgId, regularUser.userId, "regular");

		// Create an invite-only, registerable event
		const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
		const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						name: "Invite-Only Registerable Event",
						description: "An invite-only event that can be registered for",
						organizationId: orgId,
						startAt,
						endAt,
						isInviteOnly: true,
						isRegisterable: true,
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		const inviteOnlyEventId = createEventResult.data.createEvent.id;

		// Register the regular user for the event (without being invited)
		await mercuriusClient.mutate(Mutation_registerForEvent, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: {
				id: inviteOnlyEventId,
			},
		});

		// Query as registered user - should see invite-only event
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: { input: { organizationId: orgId } },
		});

		expect(result.errors).toBeUndefined();
		const events = result.data?.eventsByOrganizationId;
		expect(events).toBeInstanceOf(Array);
		const eventIds = (events as Array<{ id: string }>).map((e) => e.id);
		expect(eventIds).toContain(inviteOnlyEventId);
	});

	test("should not show invite-only events to unauthorized users", async () => {
		// Create a regular user and add to organization
		const regularUser = await createUserAndGetToken();
		await addMembership(orgId, regularUser.userId, "regular");

		// Create an invite-only event
		const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
		const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						name: "Invite-Only Event",
						description: "An invite-only event",
						organizationId: orgId,
						startAt,
						endAt,
						isInviteOnly: true,
					},
				},
			},
		);

		assertToBeNonNullish(createEventResult.data?.createEvent);
		const inviteOnlyEventId = createEventResult.data.createEvent.id;

		// Query as regular user (not invited, not registered) - should NOT see invite-only event
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: { input: { organizationId: orgId } },
		});

		expect(result.errors).toBeUndefined();
		const events = result.data?.eventsByOrganizationId;
		expect(events).toBeInstanceOf(Array);
		const eventIds = (events as Array<{ id: string }>).map((e) => e.id);
		expect(eventIds).not.toContain(inviteOnlyEventId);
	});

	test("should filter correctly with mix of public and invite-only events", async () => {
		// Create a regular user and add to organization
		const regularUser = await createUserAndGetToken();
		await addMembership(orgId, regularUser.userId, "regular");

		// Create a public event
		const publicStartAt = new Date(
			Date.now() + 24 * 60 * 60 * 1000,
		).toISOString();
		const publicEndAt = new Date(
			Date.now() + 25 * 60 * 60 * 1000,
		).toISOString();

		const publicEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						name: "Public Event",
						description: "A public event",
						organizationId: orgId,
						startAt: publicStartAt,
						endAt: publicEndAt,
						isPublic: true,
						isInviteOnly: false,
					},
				},
			},
		);

		assertToBeNonNullish(publicEventResult.data?.createEvent);
		const publicEventId = publicEventResult.data.createEvent.id;

		// Create an invite-only event
		const inviteOnlyStartAt = new Date(
			Date.now() + 26 * 60 * 60 * 1000,
		).toISOString();
		const inviteOnlyEndAt = new Date(
			Date.now() + 27 * 60 * 60 * 1000,
		).toISOString();

		const inviteOnlyEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `bearer ${globalAuth.authToken}` },
				variables: {
					input: {
						name: "Invite-Only Event",
						description: "An invite-only event",
						organizationId: orgId,
						startAt: inviteOnlyStartAt,
						endAt: inviteOnlyEndAt,
						isInviteOnly: true,
					},
				},
			},
		);

		assertToBeNonNullish(inviteOnlyEventResult.data?.createEvent);
		const inviteOnlyEventId = inviteOnlyEventResult.data.createEvent.id;

		// Query as regular user (not invited to invite-only event) - should only see public event
		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: { input: { organizationId: orgId } },
		});

		expect(result.errors).toBeUndefined();
		const events = result.data?.eventsByOrganizationId;
		expect(events).toBeInstanceOf(Array);
		const eventIds = (events as Array<{ id: string }>).map((e) => e.id);
		expect(eventIds).toContain(publicEventId);
		expect(eventIds).not.toContain(inviteOnlyEventId);

		// Now invite the user to the invite-only event
		await mercuriusClient.mutate(Mutation_inviteEventAttendee, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				data: {
					eventId: inviteOnlyEventId,
					userId: regularUser.userId,
				},
			},
		});

		// Query again - should now see both events
		const resultAfterInvite = await mercuriusClient.query(
			Query_eventsByOrganizationId,
			{
				headers: { authorization: `bearer ${regularUser.authToken}` },
				variables: { input: { organizationId: orgId } },
			},
		);

		expect(resultAfterInvite.errors).toBeUndefined();
		const eventsAfterInvite = resultAfterInvite.data?.eventsByOrganizationId;
		expect(eventsAfterInvite).toBeInstanceOf(Array);
		const eventIdsAfterInvite = (
			eventsAfterInvite as Array<{ id: string }>
		).map((e) => e.id);
		expect(eventIdsAfterInvite).toContain(publicEventId);
		expect(eventIdsAfterInvite).toContain(inviteOnlyEventId);
	});
	test("should return recurring event templates", async () => {
		// Create a regular user and add to organization
		const regularUser = await createUserAndGetToken();
		await addMembership(orgId, regularUser.userId, "regular");

		const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
		const end = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

		const createResult = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: { authorization: `bearer ${globalAuth.authToken}` },
			variables: {
				input: {
					name: "My Recurring Event",
					description: "A recurring event template",
					organizationId: orgId,
					startAt: start,
					endAt: end,
					isPublic: true,
					isInviteOnly: false,
					recurrence: {
						frequency: "DAILY",
						count: 3,
					},
				},
			},
		});

		assertToBeNonNullish(createResult.data?.createEvent);
		const templateId = createResult.data.createEvent.id;

		const result = await mercuriusClient.query(Query_eventsByOrganizationId, {
			headers: { authorization: `bearer ${regularUser.authToken}` },
			variables: { input: { organizationId: orgId } },
		});

		expect(result.errors).toBeUndefined();
		const events = result.data?.eventsByOrganizationId;
		expect(events).toBeInstanceOf(Array);
		const eventIds = (events as Array<{ id: string }>).map((e) => e.id);
		expect(eventIds).toContain(templateId);

		const matched = (
			events as Array<{
				id: string;
				isGenerated: boolean;
				baseRecurringEventId: string | null;
			}>
		).find((e) => e.id === templateId);
		assertToBeNonNullish(matched);
		expect(matched.isGenerated).toBe(false);
		expect(matched.baseRecurringEventId).toBeNull();
	});
});
