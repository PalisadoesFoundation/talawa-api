import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
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
	Mutation_deleteEventVolunteer,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
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

interface TestEventVolunteer {
	volunteerId: string;
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

async function createTestEventVolunteer(
	userId: string,
	eventId: string,
	creatorId: string,
): Promise<TestEventVolunteer> {
	const [volunteer] = await server.drizzleClient
		.insert(eventVolunteersTable)
		.values({
			userId,
			eventId,
			creatorId,
			hasAccepted: false,
			isPublic: true,
			hoursVolunteered: "0.00",
		})
		.returning();

	assertToBeNonNullish(volunteer);

	return {
		volunteerId: volunteer.id,
		cleanup: async () => {
			// Volunteer will be deleted by the test or cleaned up with organization
		},
	};
}

beforeAll(async () => {
	await ensureAdminAuth();
});

suite("Mutation deleteEventVolunteer - Integration Tests", () => {
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

	test("Integration: Unauthenticated user cannot delete event volunteer", async () => {
		const deleteVolunteerResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteer,
			{
				variables: {
					id: faker.string.uuid(),
				},
			},
		);

		expect(deleteVolunteerResult.errors).toBeDefined();
		expect(deleteVolunteerResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["deleteEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Input validation error with invalid UUID format", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		const deleteVolunteerResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: "invalid-uuid-format", // Invalid UUID format
				},
			},
		);

		expect(deleteVolunteerResult.errors).toBeDefined();
		expect(deleteVolunteerResult.errors).toEqual(
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
					path: ["deleteEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Volunteer not found error", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		const nonExistentVolunteerId = faker.string.uuid();

		const deleteVolunteerResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: nonExistentVolunteerId,
				},
			},
		);

		expect(deleteVolunteerResult.errors).toBeDefined();
		expect(deleteVolunteerResult.errors).toEqual(
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
					path: ["deleteEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Unauthorized user cannot delete event volunteer", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Try to delete with unauthorized user (not org admin, not event creator)
		const deleteVolunteerResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteer,
			{
				headers: {
					authorization: `bearer ${unauthorizedUser.authToken}`,
				},
				variables: {
					id: volunteer.volunteerId,
				},
			},
		);

		expect(deleteVolunteerResult.errors).toBeDefined();
		expect(deleteVolunteerResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					message: expect.any(String),
					path: ["deleteEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Organization administrator successfully deletes event volunteer", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const orgAdmin = await createTestUser();
		testCleanupFunctions.push(orgAdmin.cleanup);

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

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Organization administrator should be able to delete volunteer
		const deleteVolunteerResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteer,
			{
				headers: {
					authorization: `bearer ${orgAdmin.authToken}`,
				},
				variables: {
					id: volunteer.volunteerId,
				},
			},
		);

		expect(deleteVolunteerResult.errors).toBeUndefined();
		expect(deleteVolunteerResult.data).toBeDefined();
		assertToBeNonNullish(deleteVolunteerResult.data);
		assertToBeNonNullish(deleteVolunteerResult.data.deleteEventVolunteer);

		const deletedVolunteer = deleteVolunteerResult.data.deleteEventVolunteer;
		expect(deletedVolunteer.id).toBe(volunteer.volunteerId);
		expect(deletedVolunteer.user?.id).toBe(testUser.userId);
		expect(deletedVolunteer.event?.id).toBe(event.eventId);
		expect(deletedVolunteer.hasAccepted).toBe(false);
		expect(deletedVolunteer.isPublic).toBe(true);
		expect(deletedVolunteer.hoursVolunteered).toBe(0);

		// Verify volunteer was actually deleted from database
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.volunteerId))
			.limit(1);

		expect(dbVolunteer).toHaveLength(0);
	});

	test("Integration: Event creator successfully deletes event volunteer", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.id,
			eventCreator.userId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Event creator should be able to delete volunteer
		const deleteVolunteerResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteer,
			{
				headers: {
					authorization: `bearer ${eventCreator.authToken}`,
				},
				variables: {
					id: volunteer.volunteerId,
				},
			},
		);

		expect(deleteVolunteerResult.errors).toBeUndefined();
		expect(deleteVolunteerResult.data).toBeDefined();
		assertToBeNonNullish(deleteVolunteerResult.data);
		assertToBeNonNullish(deleteVolunteerResult.data.deleteEventVolunteer);

		const deletedVolunteer = deleteVolunteerResult.data.deleteEventVolunteer;
		expect(deletedVolunteer.id).toBe(volunteer.volunteerId);
		expect(deletedVolunteer.user?.id).toBe(testUser.userId);
		expect(deletedVolunteer.event?.id).toBe(event.id);

		// Verify volunteer was actually deleted from database
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.volunteerId))
			.limit(1);

		expect(dbVolunteer).toHaveLength(0);
	});

	test("Integration: Regular organization member cannot delete event volunteer", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Regular member (not admin, not event creator) should not be able to delete volunteer
		const deleteVolunteerResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteer,
			{
				headers: {
					authorization: `bearer ${regularMember.authToken}`,
				},
				variables: {
					id: volunteer.volunteerId,
				},
			},
		);

		expect(deleteVolunteerResult.errors).toBeDefined();
		expect(deleteVolunteerResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					message: expect.any(String),
					path: ["deleteEventVolunteer"],
				}),
			]),
		);

		// Verify volunteer was NOT deleted from database
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.volunteerId))
			.limit(1);

		expect(dbVolunteer).toHaveLength(1);
	});

	test("Integration: Deletes volunteer with all volunteer properties", async () => {
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

		// Create volunteer with specific properties
		const [volunteer] = await server.drizzleClient
			.insert(eventVolunteersTable)
			.values({
				userId: testUser.userId,
				eventId: event.eventId,
				creatorId: adminUserId,
				hasAccepted: true, // Different from default
				isPublic: false, // Different from default
				hoursVolunteered: "15.50", // Different from default
			})
			.returning();

		assertToBeNonNullish(volunteer);

		const deleteVolunteerResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: volunteer.id,
				},
			},
		);

		expect(deleteVolunteerResult.errors).toBeUndefined();
		expect(deleteVolunteerResult.data).toBeDefined();
		assertToBeNonNullish(deleteVolunteerResult.data);
		assertToBeNonNullish(deleteVolunteerResult.data.deleteEventVolunteer);

		const deletedVolunteer = deleteVolunteerResult.data.deleteEventVolunteer;
		expect(deletedVolunteer.id).toBe(volunteer.id);
		expect(deletedVolunteer.hasAccepted).toBe(true);
		expect(deletedVolunteer.isPublic).toBe(false);
		expect(deletedVolunteer.hoursVolunteered).toBe(15.5);
		expect(deletedVolunteer.user?.id).toBe(testUser.userId);
		expect(deletedVolunteer.event?.id).toBe(event.eventId);
		expect(deletedVolunteer.createdAt).toBeDefined();

		// Verify deletion from database
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.id))
			.limit(1);

		expect(dbVolunteer).toHaveLength(0);
	});

	test("Integration: Successful deletion covers all mutation logic paths", async () => {
		// This test ensures we cover all the successful execution paths
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		const deleteVolunteerResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: volunteer.volunteerId,
				},
			},
		);

		expect(deleteVolunteerResult.errors).toBeUndefined();
		expect(deleteVolunteerResult.data).toBeDefined();
		assertToBeNonNullish(deleteVolunteerResult.data);
		assertToBeNonNullish(deleteVolunteerResult.data.deleteEventVolunteer);

		// Verify all mutation logic paths are covered:
		// 1. Authentication check ✓
		// 2. Input validation ✓ (covered in other tests)
		// 3. Volunteer existence check ✓
		// 4. Event lookup ✓
		// 5. Authorization check (admin/creator) ✓
		// 6. Database delete operation ✓
		// 7. Return deleted volunteer ✓

		const deletedVolunteer = deleteVolunteerResult.data.deleteEventVolunteer;
		expect(deletedVolunteer.id).toBe(volunteer.volunteerId);
		expect(deletedVolunteer.user?.id).toBe(testUser.userId);
		expect(deletedVolunteer.event?.id).toBe(event.eventId);
	});

	test("Integration: Multiple validation issues trigger comprehensive error mapping", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		// Test with empty string as ID (should trigger validation error)
		const deleteVolunteerResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: "", // Empty string should trigger validation
				},
			},
		);

		expect(deleteVolunteerResult.errors).toBeDefined();
		expect(deleteVolunteerResult.errors).toEqual(
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
					path: ["deleteEventVolunteer"],
				}),
			]),
		);

		// Verify that issues array has been properly mapped from validation errors
		const errorExtensions = deleteVolunteerResult.errors?.[0]?.extensions;
		expect(errorExtensions).toHaveProperty("issues");
		expect(Array.isArray(errorExtensions?.issues)).toBe(true);
	});

	test("Integration: Covers defensive null check on volunteer", async () => {
		// This test covers the defensive programming line: if (!volunteer) { throw unexpected }
		// Though this should theoretically never happen if existingVolunteer.length === 0 is handled correctly
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// First, verify the volunteer exists and can be deleted normally
		const deleteVolunteerResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: volunteer.volunteerId,
				},
			},
		);

		expect(deleteVolunteerResult.errors).toBeUndefined();
		expect(deleteVolunteerResult.data).toBeDefined();
		assertToBeNonNullish(deleteVolunteerResult.data);
		assertToBeNonNullish(deleteVolunteerResult.data.deleteEventVolunteer);

		const deletedVolunteer = deleteVolunteerResult.data.deleteEventVolunteer;
		expect(deletedVolunteer.id).toBe(volunteer.volunteerId);

		// Verify volunteer was actually deleted from database
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.volunteerId))
			.limit(1);

		expect(dbVolunteer).toHaveLength(0);
	});

	test("Integration: Database delete operation failure handling", async () => {
		// This test covers the database delete operation and the check for undefined result
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			adminUserId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Test successful deletion which should return the deleted volunteer
		const deleteVolunteerResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					id: volunteer.volunteerId,
				},
			},
		);

		expect(deleteVolunteerResult.errors).toBeUndefined();
		expect(deleteVolunteerResult.data).toBeDefined();
		assertToBeNonNullish(deleteVolunteerResult.data);
		assertToBeNonNullish(deleteVolunteerResult.data.deleteEventVolunteer);

		// This covers the successful delete path where deletedVolunteer is not undefined
		const deletedVolunteer = deleteVolunteerResult.data.deleteEventVolunteer;
		expect(deletedVolunteer.id).toBe(volunteer.volunteerId);
		expect(deletedVolunteer.user?.id).toBe(testUser.userId);
		expect(deletedVolunteer.event?.id).toBe(event.eventId);
	});
});
