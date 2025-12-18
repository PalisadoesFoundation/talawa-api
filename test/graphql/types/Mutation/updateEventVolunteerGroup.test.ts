import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_updateEventVolunteerGroup,
	Query_signIn,
} from "../documentNodes";

// Admin auth (fetched once per suite)
let adminToken: string | null = null;
let adminUserId: string | null = null;
async function ensureAdminAuth(): Promise<{ token: string; userId: string }> {
	if (adminToken && adminUserId)
		return { token: adminToken, userId: adminUserId };
	if (
		!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ||
		!server.envConfig.API_ADMINISTRATOR_USER_PASSWORD
	) {
		throw new Error("Admin credentials missing in env config");
	}
	const res = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	if (
		res.errors ||
		!res.data?.signIn?.authenticationToken ||
		!res.data?.signIn?.user?.id
	) {
		throw new Error(
			`Unable to sign in admin: ${res.errors?.[0]?.message || "unknown"}`,
		);
	}
	adminToken = res.data.signIn.authenticationToken;
	adminUserId = res.data.signIn.user.id;
	assertToBeNonNullish(adminToken);
	assertToBeNonNullish(adminUserId);
	return { token: adminToken, userId: adminUserId };
}

// Helper Types
interface TestOrganization {
	orgId: string;
	cleanup: () => Promise<void>;
}

interface TestEvent {
	eventId: string;
	cleanup: () => Promise<void>;
}

interface TestUser {
	userId: string;
	authToken: string;
	cleanup: () => Promise<void>;
}

interface TestEventVolunteerGroup {
	groupId: string;
	cleanup: () => Promise<void>;
}

async function createTestOrganization(): Promise<TestOrganization> {
	const { token } = await ensureAdminAuth();
	const res = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: { name: `Org ${faker.string.uuid()}`, countryCode: "us" },
		},
	});
	if (!res.data?.createOrganization?.id)
		throw new Error(res.errors?.[0]?.message || "org create failed");
	const orgId = res.data.createOrganization.id;
	return {
		orgId,
		cleanup: async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: orgId } },
			});
		},
	};
}

async function createTestUser(): Promise<TestUser> {
	const regularUser = await createRegularUserUsingAdmin();
	return {
		userId: regularUser.userId,
		authToken: regularUser.authToken,
		cleanup: async () => {
			const { token } = await ensureAdminAuth();
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: regularUser.userId } },
			});
		},
	};
}

async function createTestEvent(organizationId: string): Promise<TestEvent> {
	const { token: adminAuthToken } = await ensureAdminAuth();
	const startAt = new Date();
	startAt.setHours(startAt.getHours() + 1);
	const endAt = new Date(startAt);
	endAt.setHours(endAt.getHours() + 2);

	// Make sure admin is a member of the organization first
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				memberId: adminUserId || "",
				organizationId: organizationId,
				role: "administrator",
			},
		},
	});

	const res = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: {
			input: {
				organizationId,
				name: `Test Event ${faker.lorem.words(3)}`,
				description: `Test event description ${faker.lorem.paragraph()}`,
				startAt: startAt.toISOString(),
				endAt: endAt.toISOString(),
				isPublic: true,
				isRegisterable: true,
			},
		},
	});
	if (!res.data?.createEvent?.id)
		throw new Error(res.errors?.[0]?.message || "event create failed");
	return {
		eventId: res.data.createEvent.id,
		cleanup: async () => {
			/* Events get cleaned up when organization is deleted */
		},
	};
}

async function createTestEventVolunteerGroup(
	eventId: string,
	leaderId: string,
	creatorId: string,
	name = "Test Group",
	description = "Test group description",
	volunteersRequired = 5,
): Promise<TestEventVolunteerGroup> {
	const [group] = await server.drizzleClient
		.insert(eventVolunteerGroupsTable)
		.values({
			eventId,
			leaderId,
			creatorId,
			name,
			description,
			volunteersRequired,
		})
		.returning();

	assertToBeNonNullish(group);

	return {
		groupId: group.id,
		cleanup: async () => {
			// Group will be cleaned up with organization
		},
	};
}

beforeAll(async () => {
	await ensureAdminAuth();
});

suite("Mutation updateEventVolunteerGroup - Integration Tests", () => {
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

	test("Integration: Unauthenticated user cannot update volunteer group", async () => {
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				variables: {
					id: faker.string.uuid(),
					data: {
						eventId: faker.string.uuid(),
						name: "Updated Group",
					},
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["updateEventVolunteerGroup"],
				}),
			]),
		);
	});

	test("Integration: Input validation error with invalid UUID format", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: "invalid-uuid-format", // Invalid UUID format
					data: {
						eventId: "invalid-event-uuid", // Invalid UUID format
						name: "Updated Group",
					},
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: expect.any(Array),
								message: expect.any(String),
							}),
						]),
					}),
					message: expect.any(String),
					path: ["updateEventVolunteerGroup"],
				}),
			]),
		);
	});

	test("Integration: Volunteer group not found error", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const nonExistentGroupId = faker.string.uuid();

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: nonExistentGroupId,
					data: {
						eventId: event.eventId,
						name: "Updated Group",
					},
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["id"],
							}),
						]),
					}),
					message: expect.any(String),
					path: ["updateEventVolunteerGroup"],
				}),
			]),
		);
	});

	test("Integration: Organization administrator successfully updates volunteer group", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const orgAdmin = await createTestUser();
		testCleanupFunctions.push(orgAdmin.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		// Add org admin to organization as administrator
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: orgAdmin.userId,
					organizationId: organization.orgId,
					role: "administrator",
				},
			},
		});

		// Add test user to organization as regular member
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const group = await createTestEventVolunteerGroup(
			event.eventId,
			testUser.userId, // Leader
			adminUserId, // Creator
			"Original Group Name",
			"Original description",
			3,
		);
		testCleanupFunctions.push(group.cleanup);

		// Organization administrator should be able to update group
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${orgAdmin.authToken}`,
				},
				variables: {
					id: group.groupId,
					data: {
						eventId: event.eventId,
						name: "Updated Group Name",
						description: "Updated description",
						volunteersRequired: 7,
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteerGroup);

		const updatedGroup = updateResult.data.updateEventVolunteerGroup;
		expect(updatedGroup.id).toBe(group.groupId);
		expect(updatedGroup.name).toBe("Updated Group Name");
		expect(updatedGroup.description).toBe("Updated description");
		expect(updatedGroup.volunteersRequired).toBe(7);
		expect(updatedGroup.leader?.id).toBe(testUser.userId);
		expect(updatedGroup.event?.id).toBe(event.eventId);
		expect(updatedGroup.creator?.id).toBe(adminUserId);
		expect(updatedGroup.updater?.id).toBe(orgAdmin.userId);
		expect(updatedGroup.updatedAt).toBeDefined();

		// Verify database was updated
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup).toHaveLength(1);
		expect(dbGroup[0]?.name).toBe("Updated Group Name");
		expect(dbGroup[0]?.description).toBe("Updated description");
		expect(dbGroup[0]?.volunteersRequired).toBe(7);
		expect(dbGroup[0]?.updaterId).toBe(orgAdmin.userId);
	});

	test("Integration: Event creator successfully updates volunteer group", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const eventCreator = await createTestUser();
		testCleanupFunctions.push(eventCreator.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		// Add both users to organization as regular members
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: eventCreator.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		// Create event directly in database with eventCreator as creator
		const startAt = new Date();
		startAt.setHours(startAt.getHours() + 1);
		const endAt = new Date(startAt);
		endAt.setHours(endAt.getHours() + 2);

		const [event] = await server.drizzleClient
			.insert(eventsTable)
			.values({
				name: `Creator Event ${faker.lorem.words(3)}`,
				description: `Event created by specific user ${faker.lorem.paragraph()}`,
				startAt,
				endAt,
				organizationId: organization.orgId,
				creatorId: eventCreator.userId, // Event creator
				isPublic: true,
				isRegisterable: true,
			})
			.returning();

		assertToBeNonNullish(event);

		const group = await createTestEventVolunteerGroup(
			event.id,
			testUser.userId, // Leader
			eventCreator.userId, // Creator (same as event creator)
		);
		testCleanupFunctions.push(group.cleanup);

		// Event creator should be able to update group
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${eventCreator.authToken}`,
				},
				variables: {
					id: group.groupId,
					data: {
						eventId: event.id,
						name: "Event Creator Updated",
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteerGroup);

		const updatedGroup = updateResult.data.updateEventVolunteerGroup;
		expect(updatedGroup.id).toBe(group.groupId);
		expect(updatedGroup.name).toBe("Event Creator Updated");
		expect(updatedGroup.updater?.id).toBe(eventCreator.userId);
	});

	test("Integration: Group creator successfully updates volunteer group", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const groupCreator = await createTestUser();
		testCleanupFunctions.push(groupCreator.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		// Add both users to organization as regular members
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: groupCreator.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const group = await createTestEventVolunteerGroup(
			event.eventId,
			testUser.userId, // Leader
			groupCreator.userId, // Creator (different from event creator)
		);
		testCleanupFunctions.push(group.cleanup);

		// Group creator should be able to update group
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${groupCreator.authToken}`,
				},
				variables: {
					id: group.groupId,
					data: {
						eventId: event.eventId,
						name: "Group Creator Updated",
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteerGroup);

		const updatedGroup = updateResult.data.updateEventVolunteerGroup;
		expect(updatedGroup.id).toBe(group.groupId);
		expect(updatedGroup.name).toBe("Group Creator Updated");
		expect(updatedGroup.updater?.id).toBe(groupCreator.userId);
	});

	test("Integration: Unauthorized user cannot update volunteer group", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const unauthorizedUser = await createTestUser();
		testCleanupFunctions.push(unauthorizedUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		// Add test user to organization as regular member
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		// Do NOT add unauthorized user to organization
		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const group = await createTestEventVolunteerGroup(
			event.eventId,
			testUser.userId, // Leader
			adminUserId, // Creator
		);
		testCleanupFunctions.push(group.cleanup);

		// Try to update with unauthorized user (not org admin, not event creator, not group creator)
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${unauthorizedUser.authToken}`,
				},
				variables: {
					id: group.groupId,
					data: {
						eventId: event.eventId,
						name: "Unauthorized Update",
					},
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					message: expect.any(String),
					path: ["updateEventVolunteerGroup"],
				}),
			]),
		);

		// Verify group was NOT updated in database
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup).toHaveLength(1);
		expect(dbGroup[0]?.name).toBe("Test Group"); // Unchanged
	});

	test("Integration: Name conflict validation error", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		// Create first group
		const group1 = await createTestEventVolunteerGroup(
			event.eventId,
			testUser.userId,
			adminUserId,
			"Existing Group Name",
		);
		testCleanupFunctions.push(group1.cleanup);

		// Create second group
		const group2 = await createTestEventVolunteerGroup(
			event.eventId,
			testUser.userId,
			adminUserId,
			"Different Group Name",
		);
		testCleanupFunctions.push(group2.cleanup);

		// Try to update group2 to have the same name as group1
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: group2.groupId,
					data: {
						eventId: event.eventId,
						name: "Existing Group Name", // Conflicts with group1
					},
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["data", "name"],
								message:
									"A volunteer group with this name already exists for this event",
							}),
						]),
					}),
					message: expect.any(String),
					path: ["updateEventVolunteerGroup"],
				}),
			]),
		);

		// Verify group2 was NOT updated
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group2.groupId))
			.limit(1);

		expect(dbGroup[0]?.name).toBe("Different Group Name"); // Unchanged
	});

	test("Integration: Update name field only", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const group = await createTestEventVolunteerGroup(
			event.eventId,
			testUser.userId,
			adminUserId,
			"Original Name",
			"Original Description",
			5,
		);
		testCleanupFunctions.push(group.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: group.groupId,
					data: {
						eventId: event.eventId,
						name: "New Name Only", // Only update name
						// description and volunteersRequired not provided
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteerGroup);

		const updatedGroup = updateResult.data.updateEventVolunteerGroup;
		expect(updatedGroup.name).toBe("New Name Only"); // Updated
		expect(updatedGroup.description).toBe("Original Description"); // Unchanged
		expect(updatedGroup.volunteersRequired).toBe(5); // Unchanged

		// Verify database state
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup[0]?.name).toBe("New Name Only");
		expect(dbGroup[0]?.description).toBe("Original Description");
		expect(dbGroup[0]?.volunteersRequired).toBe(5);
	});

	test("Integration: Update description field only", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const group = await createTestEventVolunteerGroup(
			event.eventId,
			testUser.userId,
			adminUserId,
			"Original Name",
			"Original Description",
			5,
		);
		testCleanupFunctions.push(group.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: group.groupId,
					data: {
						eventId: event.eventId,
						description: "New Description Only", // Only update description
						// name and volunteersRequired not provided
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteerGroup);

		const updatedGroup = updateResult.data.updateEventVolunteerGroup;
		expect(updatedGroup.name).toBe("Original Name"); // Unchanged
		expect(updatedGroup.description).toBe("New Description Only"); // Updated
		expect(updatedGroup.volunteersRequired).toBe(5); // Unchanged

		// Verify database state
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup[0]?.name).toBe("Original Name");
		expect(dbGroup[0]?.description).toBe("New Description Only");
		expect(dbGroup[0]?.volunteersRequired).toBe(5);
	});

	test("Integration: Update volunteersRequired field only", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const group = await createTestEventVolunteerGroup(
			event.eventId,
			testUser.userId,
			adminUserId,
			"Original Name",
			"Original Description",
			5,
		);
		testCleanupFunctions.push(group.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: group.groupId,
					data: {
						eventId: event.eventId,
						volunteersRequired: 10, // Only update volunteersRequired
						// name and description not provided
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteerGroup);

		const updatedGroup = updateResult.data.updateEventVolunteerGroup;
		expect(updatedGroup.name).toBe("Original Name"); // Unchanged
		expect(updatedGroup.description).toBe("Original Description"); // Unchanged
		expect(updatedGroup.volunteersRequired).toBe(10); // Updated

		// Verify database state
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup[0]?.name).toBe("Original Name");
		expect(dbGroup[0]?.description).toBe("Original Description");
		expect(dbGroup[0]?.volunteersRequired).toBe(10);
	});

	test("Integration: Update all fields simultaneously", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const group = await createTestEventVolunteerGroup(
			event.eventId,
			testUser.userId,
			adminUserId,
			"Original Name",
			"Original Description",
			5,
		);
		testCleanupFunctions.push(group.cleanup);

		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: group.groupId,
					data: {
						eventId: event.eventId,
						name: "All Fields Updated Name",
						description: "All fields updated description",
						volunteersRequired: 15,
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteerGroup);

		const updatedGroup = updateResult.data.updateEventVolunteerGroup;
		expect(updatedGroup.name).toBe("All Fields Updated Name");
		expect(updatedGroup.description).toBe("All fields updated description");
		expect(updatedGroup.volunteersRequired).toBe(15);
		expect(updatedGroup.updater?.id).toBe(adminUserId);

		// Verify database state
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup[0]?.name).toBe("All Fields Updated Name");
		expect(dbGroup[0]?.description).toBe("All fields updated description");
		expect(dbGroup[0]?.volunteersRequired).toBe(15);
	});

	test("Integration: Multiple validation issues trigger comprehensive error mapping", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		// Test with invalid data to trigger validation errors
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: "", // Empty string should trigger validation
					data: {
						eventId: "invalid-event-uuid", // Invalid UUID format
						volunteersRequired: -5, // Negative number might trigger validation
					},
				},
			},
		);

		expect(updateResult.errors).toBeDefined();
		expect(updateResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: expect.any(Array),
								message: expect.any(String),
							}),
						]),
					}),
					message: expect.any(String),
					path: ["updateEventVolunteerGroup"],
				}),
			]),
		);

		// Verify that issues array has been properly mapped from validation errors
		const errorExtensions = updateResult.errors?.[0]?.extensions;
		expect(errorExtensions).toHaveProperty("issues");
		expect(Array.isArray(errorExtensions?.issues)).toBe(true);
		expect(
			Array.isArray(errorExtensions?.issues) && errorExtensions.issues.length,
		).toBeGreaterThan(0);
	});

	test("Integration: Group array defensive check and database operation verification", async () => {
		// This test covers: const group = existingGroup[0]; if (!group) { throw unexpected }
		// And: if (updatedGroup === undefined) { throw unexpected }
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const group = await createTestEventVolunteerGroup(
			event.eventId,
			testUser.userId,
			adminUserId,
			"Defensive Test Group",
			"Group for testing defensive checks",
			8,
		);
		testCleanupFunctions.push(group.cleanup);

		// Test successful update which should not trigger the defensive checks
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: group.groupId,
					data: {
						eventId: event.eventId,
						name: "Defensive Check Passed",
						description: "Updated successfully",
						volunteersRequired: 12,
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteerGroup);

		// This verifies that group was found (covering defensive check) and updatedGroup is NOT undefined
		const updatedGroup = updateResult.data.updateEventVolunteerGroup;
		expect(updatedGroup).toBeDefined();
		expect(updatedGroup.id).toBe(group.groupId);
		expect(updatedGroup.name).toBe("Defensive Check Passed");
		expect(updatedGroup.description).toBe("Updated successfully");
		expect(updatedGroup.volunteersRequired).toBe(12);
		expect(updatedGroup.updater?.id).toBe(adminUserId);

		// Verify database update was successful
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup).toHaveLength(1);
		expect(dbGroup[0]?.name).toBe("Defensive Check Passed");
		expect(dbGroup[0]?.description).toBe("Updated successfully");
		expect(dbGroup[0]?.volunteersRequired).toBe(12);
		expect(dbGroup[0]?.updaterId).toBe(adminUserId);
		expect(dbGroup[0]?.updatedAt).toBeDefined();
	});

	test("Integration: Name update to same name should pass (self-conflict check)", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const group = await createTestEventVolunteerGroup(
			event.eventId,
			testUser.userId,
			adminUserId,
			"Keep Same Name",
			"Original Description",
			5,
		);
		testCleanupFunctions.push(group.cleanup);

		// Update with the same name (should not trigger conflict since it's the same group)
		const updateResult = await mercuriusClient.mutate(
			Mutation_updateEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: group.groupId,
					data: {
						eventId: event.eventId,
						name: "Keep Same Name", // Same name as current
						description: "Updated Description",
					},
				},
			},
		);

		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data).toBeDefined();
		assertToBeNonNullish(updateResult.data);
		assertToBeNonNullish(updateResult.data.updateEventVolunteerGroup);

		const updatedGroup = updateResult.data.updateEventVolunteerGroup;
		expect(updatedGroup.name).toBe("Keep Same Name"); // Should work
		expect(updatedGroup.description).toBe("Updated Description"); // Updated

		// This covers the name conflict logic with self-exclusion:
		// if (nameConflict.length > 0 && nameConflict[0]?.id !== parsedArgs.id)
		// Since it's the same group, nameConflict[0]?.id === parsedArgs.id, so no conflict
	});
});
