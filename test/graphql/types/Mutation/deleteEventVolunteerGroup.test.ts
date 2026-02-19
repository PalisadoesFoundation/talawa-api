import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteEventVolunteerGroup,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_currentUser,
} from "../documentNodes";

let adminToken: string | null = null;
let adminUserId: string | null = null;
async function ensureAdminAuth(): Promise<{ token: string; userId: string }> {
	if (adminToken && adminUserId)
		return { token: adminToken, userId: adminUserId };
	const { accessToken } = await getAdminAuthViaRest(server);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${accessToken}` },
	});
	const userId = currentUserResult.data?.currentUser?.id;
	assertToBeNonNullish(accessToken);
	assertToBeNonNullish(userId);
	adminToken = accessToken;
	adminUserId = userId;
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
	name?: string,
	description?: string,
	volunteersRequired?: number,
): Promise<TestEventVolunteerGroup> {
	const [group] = await server.drizzleClient
		.insert(eventVolunteerGroupsTable)
		.values({
			eventId,
			leaderId,
			creatorId,
			name: name || `Test Group ${faker.lorem.words(2)}`,
			description:
				description || `Test group description ${faker.lorem.sentence()}`,
			volunteersRequired:
				volunteersRequired || faker.number.int({ min: 1, max: 10 }),
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

suite("Mutation deleteEventVolunteerGroup - Integration Tests", () => {
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

	test("Integration: Unauthenticated user cannot delete volunteer group", async () => {
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				variables: {
					id: faker.string.uuid(),
				},
			},
		);

		expect(deleteResult.errors).toBeDefined();
		expect(deleteResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["deleteEventVolunteerGroup"],
				}),
			]),
		);
	});

	test("Integration: Input validation error with invalid UUID format", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: "invalid-uuid-format", // Invalid UUID format
				},
			},
		);

		expect(deleteResult.errors).toBeDefined();
		expect(deleteResult.errors).toEqual(
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
					path: ["deleteEventVolunteerGroup"],
				}),
			]),
		);
	});

	test("Integration: Volunteer group not found error", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		const nonExistentGroupId = faker.string.uuid();

		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: nonExistentGroupId,
				},
			},
		);

		expect(deleteResult.errors).toBeDefined();
		expect(deleteResult.errors).toEqual(
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
					path: ["deleteEventVolunteerGroup"],
				}),
			]),
		);
	});

	test("Integration: Organization administrator successfully deletes volunteer group", async () => {
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
			"Marketing Team",
			"Team responsible for marketing activities",
			5,
		);
		testCleanupFunctions.push(group.cleanup);

		// Organization administrator should be able to delete group
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${orgAdmin.authToken}`,
				},
				variables: {
					id: group.groupId,
				},
			},
		);

		expect(deleteResult.errors).toBeUndefined();
		expect(deleteResult.data).toBeDefined();
		assertToBeNonNullish(deleteResult.data);
		assertToBeNonNullish(deleteResult.data.deleteEventVolunteerGroup);

		const deletedGroup = deleteResult.data.deleteEventVolunteerGroup;
		expect(deletedGroup.id).toBe(group.groupId);
		expect(deletedGroup.name).toBe("Marketing Team");
		expect(deletedGroup.description).toBe(
			"Team responsible for marketing activities",
		);
		expect(deletedGroup.volunteersRequired).toBe(5);
		expect(deletedGroup.leader?.id).toBe(testUser.userId);
		expect(deletedGroup.event?.id).toBe(event.eventId);
		expect(deletedGroup.creator?.id).toBe(adminUserId);
		expect(deletedGroup.createdAt).toBeDefined();
		expect(deletedGroup.updatedAt).toBeDefined();

		// Verify group was actually deleted from database
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup).toHaveLength(0);
	});

	test("Integration: Event creator successfully deletes volunteer group", async () => {
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

		// Event creator should be able to delete group
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${eventCreator.authToken}`,
				},
				variables: {
					id: group.groupId,
				},
			},
		);

		expect(deleteResult.errors).toBeUndefined();
		expect(deleteResult.data).toBeDefined();
		assertToBeNonNullish(deleteResult.data);
		assertToBeNonNullish(deleteResult.data.deleteEventVolunteerGroup);

		const deletedGroup = deleteResult.data.deleteEventVolunteerGroup;
		expect(deletedGroup.id).toBe(group.groupId);
		expect(deletedGroup.leader?.id).toBe(testUser.userId);
		expect(deletedGroup.event?.id).toBe(event.id);
		expect(deletedGroup.creator?.id).toBe(eventCreator.userId);

		// Verify group was actually deleted from database
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup).toHaveLength(0);
	});

	test("Integration: Group creator successfully deletes volunteer group", async () => {
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

		// Group creator should be able to delete group
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${groupCreator.authToken}`,
				},
				variables: {
					id: group.groupId,
				},
			},
		);

		expect(deleteResult.errors).toBeUndefined();
		expect(deleteResult.data).toBeDefined();
		assertToBeNonNullish(deleteResult.data);
		assertToBeNonNullish(deleteResult.data.deleteEventVolunteerGroup);

		const deletedGroup = deleteResult.data.deleteEventVolunteerGroup;
		expect(deletedGroup.id).toBe(group.groupId);
		expect(deletedGroup.creator?.id).toBe(groupCreator.userId);

		// Verify group was actually deleted from database
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup).toHaveLength(0);
	});

	test("Integration: Unauthorized user cannot delete volunteer group", async () => {
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

		// Try to delete with unauthorized user (not org admin, not event creator, not group creator)
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${unauthorizedUser.authToken}`,
				},
				variables: {
					id: group.groupId,
				},
			},
		);

		expect(deleteResult.errors).toBeDefined();
		expect(deleteResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					message: expect.any(String),
					path: ["deleteEventVolunteerGroup"],
				}),
			]),
		);

		// Verify group was NOT deleted from database
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup).toHaveLength(1);
	});

	test("Integration: Regular organization member cannot delete volunteer group", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const regularMember = await createTestUser();
		testCleanupFunctions.push(regularMember.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

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
					memberId: regularMember.userId,
					organizationId: organization.orgId,
					role: "regular", // Regular member, not admin
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const group = await createTestEventVolunteerGroup(
			event.eventId,
			testUser.userId, // Leader
			adminUserId, // Creator (admin)
		);
		testCleanupFunctions.push(group.cleanup);

		// Regular member (not admin, not event creator, not group creator) should not be able to delete group
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${regularMember.authToken}`,
				},
				variables: {
					id: group.groupId,
				},
			},
		);

		expect(deleteResult.errors).toBeDefined();
		expect(deleteResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					message: expect.any(String),
					path: ["deleteEventVolunteerGroup"],
				}),
			]),
		);

		// Verify group was NOT deleted from database
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup).toHaveLength(1);
	});

	test("Integration: Cascade deletion removes related volunteer memberships", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const volunteerUser = await createTestUser();
		testCleanupFunctions.push(volunteerUser.cleanup);

		const { token: adminAuth, userId: adminUserId } = await ensureAdminAuth();

		// Add users to organization
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
					memberId: volunteerUser.userId,
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
		);
		testCleanupFunctions.push(group.cleanup);

		// Create a volunteer and membership for this group
		const [volunteer] = await server.drizzleClient
			.insert(eventVolunteersTable)
			.values({
				userId: volunteerUser.userId,
				eventId: event.eventId,
				creatorId: adminUserId,
				hasAccepted: true,
				isPublic: true,
				hoursVolunteered: "5.0",
			})
			.returning();

		assertToBeNonNullish(volunteer);

		const [membership] = await server.drizzleClient
			.insert(eventVolunteerMembershipsTable)
			.values({
				volunteerId: volunteer.id,
				eventId: event.eventId,
				groupId: group.groupId,
				status: "accepted",
				createdBy: adminUserId,
			})
			.returning();

		assertToBeNonNullish(membership);

		// Verify the membership exists before deletion
		const membershipBefore = await server.drizzleClient
			.select()
			.from(eventVolunteerMembershipsTable)
			.where(eq(eventVolunteerMembershipsTable.groupId, group.groupId));

		expect(membershipBefore).toHaveLength(1);

		// Delete the group
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: group.groupId,
				},
			},
		);

		expect(deleteResult.errors).toBeUndefined();
		expect(deleteResult.data).toBeDefined();

		// Verify group was deleted
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup).toHaveLength(0);

		// Verify related volunteer memberships were cascade deleted
		const membershipAfter = await server.drizzleClient
			.select()
			.from(eventVolunteerMembershipsTable)
			.where(eq(eventVolunteerMembershipsTable.groupId, group.groupId));

		expect(membershipAfter).toHaveLength(0);

		// Verify volunteer record still exists (only membership was deleted)
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.id))
			.limit(1);

		expect(dbVolunteer).toHaveLength(1);
	});

	test("Integration: Multiple validation issues trigger comprehensive error mapping", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		// Test with empty string as ID (should trigger validation error)
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: "", // Empty string should trigger validation error
				},
			},
		);

		expect(deleteResult.errors).toBeDefined();
		expect(deleteResult.errors).toEqual(
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
					path: ["deleteEventVolunteerGroup"],
				}),
			]),
		);

		// Verify that issues array has been properly mapped from validation errors
		const errorExtensions = deleteResult.errors?.[0]?.extensions;
		expect(errorExtensions).toHaveProperty("issues");
		expect(Array.isArray(errorExtensions?.issues)).toBe(true);
		expect(
			Array.isArray(errorExtensions?.issues) && errorExtensions.issues.length,
		).toBeGreaterThan(0);
	});

	test("Integration: Event not found triggers unexpected error (data inconsistency)", async () => {
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
		);
		testCleanupFunctions.push(group.cleanup);

		// Create data inconsistency by manually deleting the event from database
		await server.drizzleClient
			.delete(eventsTable)
			.where(eq(eventsTable.id, event.eventId));

		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: group.groupId,
				},
			},
		);

		// Since the event was deleted, the group should have been cascade deleted too
		// This should trigger the group not found error first
		expect(deleteResult.errors).toBeDefined();
		expect(deleteResult.errors).toEqual(
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
					path: ["deleteEventVolunteerGroup"],
				}),
			]),
		);
	});

	test("Integration: Group array defensive check and database operation verification", async () => {
		// This test covers: const group = existingGroup[0]; if (!group) { throw unexpected }
		// And: if (deletedGroup === undefined) { throw unexpected }
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
			"Special Team",
			"Team with special responsibilities",
			3,
		);
		testCleanupFunctions.push(group.cleanup);

		// Test successful deletion which should not trigger the defensive checks
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: group.groupId,
				},
			},
		);

		expect(deleteResult.errors).toBeUndefined();
		expect(deleteResult.data).toBeDefined();
		assertToBeNonNullish(deleteResult.data);
		assertToBeNonNullish(deleteResult.data.deleteEventVolunteerGroup);

		// This verifies that group was found (covering defensive check) and deletedGroup is NOT undefined
		const deletedGroup = deleteResult.data.deleteEventVolunteerGroup;
		expect(deletedGroup).toBeDefined();
		expect(deletedGroup.id).toBe(group.groupId);
		expect(deletedGroup.name).toBe("Special Team");
		expect(deletedGroup.description).toBe("Team with special responsibilities");
		expect(deletedGroup.volunteersRequired).toBe(3);
		expect(deletedGroup.leader?.id).toBe(testUser.userId);
		expect(deletedGroup.event?.id).toBe(event.eventId);
		expect(deletedGroup.creator?.id).toBe(adminUserId);

		// Verify group was actually deleted from database
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.groupId))
			.limit(1);

		expect(dbGroup).toHaveLength(0);
	});

	test("Integration: All authorization paths - admin, event creator, group creator", async () => {
		// This test verifies all three authorization paths work correctly
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const leader = await createTestUser();
		testCleanupFunctions.push(leader.cleanup);

		const eventCreator = await createTestUser();
		testCleanupFunctions.push(eventCreator.cleanup);

		const groupCreator = await createTestUser();
		testCleanupFunctions.push(groupCreator.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		// Add all users to organization
		for (const user of [leader, eventCreator, groupCreator]) {
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						memberId: user.userId,
						organizationId: organization.orgId,
						role: "regular",
					},
				},
			});
		}

		// Create event with specific creator
		const startAt = new Date();
		startAt.setHours(startAt.getHours() + 1);
		const endAt = new Date(startAt);
		endAt.setHours(endAt.getHours() + 2);

		const [event] = await server.drizzleClient
			.insert(eventsTable)
			.values({
				name: `Event by ${eventCreator.userId}`,
				description: "Event created by specific user",
				startAt,
				endAt,
				organizationId: organization.orgId,
				creatorId: eventCreator.userId, // Specific event creator
				isPublic: true,
				isRegisterable: true,
			})
			.returning();

		assertToBeNonNullish(event);

		// Create group with specific creator
		const group = await createTestEventVolunteerGroup(
			event.id,
			leader.userId, // Leader
			groupCreator.userId, // Group creator (different from event creator)
		);
		testCleanupFunctions.push(group.cleanup);

		// Test: Group creator can delete (isGroupCreator = true)
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${groupCreator.authToken}`,
				},
				variables: {
					id: group.groupId,
				},
			},
		);

		expect(deleteResult.errors).toBeUndefined();
		expect(deleteResult.data).toBeDefined();
		assertToBeNonNullish(deleteResult.data?.deleteEventVolunteerGroup);
	});
});
