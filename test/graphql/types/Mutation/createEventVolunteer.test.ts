import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { eventVolunteersTable } from "~/src/drizzle/tables/EventVolunteer";
import { volunteerMembershipsTable } from "~/src/drizzle/tables/EventVolunteerMembership";
import { eventVolunteerExceptionsTable } from "~/src/drizzle/tables/eventVolunteerExceptions";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
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
	Mutation_createEventVolunteer,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteOrganizationMembership,
	Mutation_deleteUser,
	Query_eventWithVolunteers,
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

async function createTestOrganization(): Promise<TestOrganization> {
	// Add delay to prevent rate limiting
	await new Promise((resolve) => setTimeout(resolve, 300));

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
			try {
				// Delete organization memberships first to prevent FK violations
				try {
					const { userId: adminId } = await ensureAdminAuth();
					await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
						headers: { authorization: `bearer ${token}` },
						variables: {
							input: {
								organizationId: orgId,
								memberId: adminId,
							},
						},
					});
				} catch (error) {
					console.warn(`Failed to delete admin membership: ${error}`);
				}

				await new Promise((resolve) => setTimeout(resolve, 200));

				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${token}` },
					variables: { input: { id: orgId } },
				});
				await new Promise((resolve) => setTimeout(resolve, 200));
			} catch (error) {
				console.warn(`Failed to delete organization: ${error}`);
			}
		},
	};
}

async function createTestUser(): Promise<TestUser> {
	// Add delay to prevent rate limiting
	await new Promise((resolve) => setTimeout(resolve, 400));

	const regularUser = await createRegularUserUsingAdmin();
	return {
		userId: regularUser.userId,
		authToken: regularUser.authToken,
		cleanup: async () => {
			try {
				const { token } = await ensureAdminAuth();
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${token}` },
					variables: { input: { id: regularUser.userId } },
				});
				await new Promise((resolve) => setTimeout(resolve, 200));
			} catch (error) {
				console.warn(`Failed to delete user: ${error}`);
			}
		},
	};
}

async function createTestEvent(organizationId: string): Promise<TestEvent> {
	// Add delay to prevent rate limiting
	await new Promise((resolve) => setTimeout(resolve, 500));

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

	await new Promise((resolve) => setTimeout(resolve, 300));

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

beforeAll(async () => {
	// Add initial delay for rate limiting protection
	await new Promise((resolve) => setTimeout(resolve, 600));
	await ensureAdminAuth();
});

suite("Mutation createEventVolunteer - Integration Tests", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		// Enhanced cleanup with proper order and delays
		const cleanupFunctionsToRun = [...testCleanupFunctions];
		testCleanupFunctions.length = 0;

		// Run cleanup functions in reverse order (LIFO - last created, first deleted)
		for (const cleanup of cleanupFunctionsToRun.reverse()) {
			try {
				await cleanup();
				await new Promise((resolve) => setTimeout(resolve, 300)); // Longer delays for cleanup
			} catch (error) {
				console.error("Cleanup failed:", error);
			}
		}

		// Extra delay after all cleanup to prevent affecting next test
		await new Promise((resolve) => setTimeout(resolve, 500));
	});

	test("Integration: Unauthenticated user cannot create event volunteer", async () => {
		// Add delay at start of first test
		await new Promise((resolve) => setTimeout(resolve, 400));

		const createEventVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				variables: {
					input: {
						userId: faker.string.uuid(),
						eventId: faker.string.uuid(),
					},
				},
			},
		);

		expect(createEventVolunteerResult.errors).toBeDefined();
		expect(createEventVolunteerResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["createEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Regular user cannot create event volunteer (authorization)", async () => {
		await new Promise((resolve) => setTimeout(resolve, 600));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();
		await new Promise((resolve) => setTimeout(resolve, 300));

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

		await new Promise((resolve) => setTimeout(resolve, 300));
		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const createEventVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: {
					authorization: `bearer ${testUser.authToken}`,
				},
				variables: {
					input: {
						userId: testUser.userId,
						eventId: event.eventId,
					},
				},
			},
		);

		expect(createEventVolunteerResult.errors).toBeDefined();
		expect(createEventVolunteerResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					message: expect.any(String),
					path: ["createEventVolunteer"],
				}),
			]),
		);
	});

	test("Integration: Admin successfully creates event volunteer with default values", async () => {
		await new Promise((resolve) => setTimeout(resolve, 800));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();
		await new Promise((resolve) => setTimeout(resolve, 300));

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

		await new Promise((resolve) => setTimeout(resolve, 300));
		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const createEventVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						userId: testUser.userId,
						eventId: event.eventId,
					},
				},
			},
		);

		expect(createEventVolunteerResult.errors).toBeUndefined();
		expect(createEventVolunteerResult.data).toBeDefined();
		assertToBeNonNullish(createEventVolunteerResult.data);
		assertToBeNonNullish(createEventVolunteerResult.data.createEventVolunteer);

		const volunteer = createEventVolunteerResult.data.createEventVolunteer;
		expect(volunteer.id).toBeDefined();
		expect(volunteer.user?.id).toBe(testUser.userId);
		expect(volunteer.event?.id).toBe(event.eventId);
		expect(volunteer.hasAccepted).toBe(false); // Default value
		expect(volunteer.isPublic).toBe(true); // Default value
		expect(volunteer.hoursVolunteered).toBe(0); // Default value
	});

	test("Integration: Returns existing volunteer for duplicate records", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();
		await new Promise((resolve) => setTimeout(resolve, 300));

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

		await new Promise((resolve) => setTimeout(resolve, 300));
		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		// Create first volunteer record
		const firstResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						userId: testUser.userId,
						eventId: event.eventId,
					},
				},
			},
		);

		expect(firstResult.errors).toBeUndefined();
		expect(firstResult.data?.createEventVolunteer).toBeDefined();
		const firstVolunteerId = firstResult.data?.createEventVolunteer?.id;

		// Try to create duplicate volunteer record - should return existing
		const duplicateResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						userId: testUser.userId,
						eventId: event.eventId,
					},
				},
			},
		);

		expect(duplicateResult.errors).toBeUndefined();
		expect(duplicateResult.data?.createEventVolunteer).toBeDefined();
		expect(duplicateResult.data?.createEventVolunteer?.id).toBe(
			firstVolunteerId,
		);
	});

	test("Integration: Multiple users can volunteer for the same event", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1200));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser1 = await createTestUser();
		testCleanupFunctions.push(testUser1.cleanup);

		const testUser2 = await createTestUser();
		testCleanupFunctions.push(testUser2.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();
		await new Promise((resolve) => setTimeout(resolve, 400));

		// Add both users to organization
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser1.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		await new Promise((resolve) => setTimeout(resolve, 300));

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: testUser2.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		await new Promise((resolve) => setTimeout(resolve, 300));
		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		// Create volunteer records for both users
		const volunteer1Result = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						userId: testUser1.userId,
						eventId: event.eventId,
					},
				},
			},
		);

		const volunteer2Result = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						userId: testUser2.userId,
						eventId: event.eventId,
					},
				},
			},
		);

		expect(volunteer1Result.errors).toBeUndefined();
		expect(volunteer2Result.errors).toBeUndefined();
		expect(volunteer1Result.data?.createEventVolunteer).toBeDefined();
		expect(volunteer2Result.data?.createEventVolunteer).toBeDefined();

		// Verify both volunteers appear in event query
		const eventWithVolunteersResult = await mercuriusClient.query(
			Query_eventWithVolunteers,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: { input: { id: event.eventId } },
			},
		);

		expect(eventWithVolunteersResult.errors).toBeUndefined();
		assertToBeNonNullish(eventWithVolunteersResult.data?.event?.volunteers);

		const volunteers = eventWithVolunteersResult.data.event.volunteers;
		expect(volunteers).toHaveLength(2);

		const volunteerIds = volunteers.map((v: { id: string | null }) => v?.id);
		expect(volunteerIds).toContain(
			volunteer1Result.data?.createEventVolunteer?.id,
		);
		expect(volunteerIds).toContain(
			volunteer2Result.data?.createEventVolunteer?.id,
		);
	});

	test("Integration: Creates volunteer with THIS_INSTANCE_ONLY scope (new volunteer path)", async () => {
		// Integration test covering the complex recurring event volunteer logic
		await new Promise((resolve) => setTimeout(resolve, 1500));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: creatorId } = await ensureAdminAuth();
		await new Promise((resolve) => setTimeout(resolve, 400));

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: creatorId,
					organizationId: organization.orgId,
					role: "administrator",
				},
			},
		});

		await new Promise((resolve) => setTimeout(resolve, 300));

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

		await new Promise((resolve) => setTimeout(resolve, 400));

		// Setup recurring event data for integration testing
		const startAt = new Date("2024-12-01T10:00:00Z");
		const endAt = new Date("2024-12-01T12:00:00Z");

		const [template] = await server.drizzleClient
			.insert(eventsTable)
			.values({
				name: "Weekly Team Meeting",
				description: "Regular team sync meeting",
				startAt,
				endAt,
				organizationId: organization.orgId,
				creatorId,
				isPublic: true,
				isRegisterable: true,
				isRecurringEventTemplate: true,
			})
			.returning();

		assertToBeNonNullish(template);

		const [recurrenceRule] = await server.drizzleClient
			.insert(recurrenceRulesTable)
			.values({
				baseRecurringEventId: template.id,
				frequency: "WEEKLY",
				interval: 1,
				count: 3,
				organizationId: organization.orgId,
				creatorId,
				recurrenceRuleString: "RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=3",
				recurrenceStartDate: startAt,
				latestInstanceDate: startAt,
			})
			.returning();

		assertToBeNonNullish(recurrenceRule);

		// Create multiple instances to test otherInstances.length > 0
		const instances = await server.drizzleClient
			.insert(recurringEventInstancesTable)
			.values([
				{
					baseRecurringEventId: template.id,
					recurrenceRuleId: recurrenceRule.id,
					originalSeriesId: template.id,
					originalInstanceStartTime: new Date("2024-12-01T10:00:00Z"),
					actualStartTime: new Date("2024-12-01T10:00:00Z"),
					actualEndTime: new Date("2024-12-01T12:00:00Z"),
					organizationId: organization.orgId,
					sequenceNumber: 1,
					totalCount: 3,
				},
				{
					baseRecurringEventId: template.id,
					recurrenceRuleId: recurrenceRule.id,
					originalSeriesId: template.id,
					originalInstanceStartTime: new Date("2024-12-08T10:00:00Z"),
					actualStartTime: new Date("2024-12-08T10:00:00Z"),
					actualEndTime: new Date("2024-12-08T12:00:00Z"),
					organizationId: organization.orgId,
					sequenceNumber: 2,
					totalCount: 3,
				},
				{
					baseRecurringEventId: template.id,
					recurrenceRuleId: recurrenceRule.id,
					originalSeriesId: template.id,
					originalInstanceStartTime: new Date("2024-12-15T10:00:00Z"),
					actualStartTime: new Date("2024-12-15T10:00:00Z"),
					actualEndTime: new Date("2024-12-15T12:00:00Z"),
					organizationId: organization.orgId,
					sequenceNumber: 3,
					totalCount: 3,
				},
			])
			.returning();

		expect(instances).toHaveLength(3);
		const targetInstanceId = instances[0]?.id;
		assertToBeNonNullish(targetInstanceId);

		// Create volunteer for THIS_INSTANCE_ONLY - covers all the uncovered code paths
		const createEventVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						userId: testUser.userId,
						eventId: template.id, // targetEventId = baseEvent.id
						scope: "THIS_INSTANCE_ONLY",
						recurringEventInstanceId: targetInstanceId,
					},
				},
			},
		);

		expect(createEventVolunteerResult.errors).toBeUndefined();
		expect(createEventVolunteerResult.data).toBeDefined();
		assertToBeNonNullish(createEventVolunteerResult.data);
		assertToBeNonNullish(createEventVolunteerResult.data.createEventVolunteer);

		const volunteer = createEventVolunteerResult.data.createEventVolunteer;
		expect(volunteer.id).toBeDefined();
		expect(volunteer.user?.id).toBe(testUser.userId);
		expect(volunteer.event?.id).toBe(template.id);

		// Verify all database operations completed correctly
		assertToBeNonNullish(volunteer.id);
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.id))
			.limit(1);

		expect(dbVolunteer).toHaveLength(1);
		expect(dbVolunteer[0]?.hasAccepted).toBe(false);
		expect(dbVolunteer[0]?.isPublic).toBe(true);
		expect(dbVolunteer[0]?.hoursVolunteered).toBe("0.00");

		// Verify volunteer membership creation
		assertToBeNonNullish(volunteer.id);
		const dbMembership = await server.drizzleClient
			.select()
			.from(volunteerMembershipsTable)
			.where(eq(volunteerMembershipsTable.volunteerId, volunteer.id));

		expect(dbMembership).toHaveLength(1);
		expect(dbMembership[0]?.eventId).toBe(template.id);
		expect(dbMembership[0]?.status).toBe("invited");
		expect(dbMembership[0]?.groupId).toBeNull();

		// Verify exception created for target instance
		assertToBeNonNullish(volunteer.id);
		const dbExceptions = await server.drizzleClient
			.select()
			.from(eventVolunteerExceptionsTable)
			.where(eq(eventVolunteerExceptionsTable.volunteerId, volunteer.id));

		expect(dbExceptions).toHaveLength(1); // 1 exception for target instance
		expect(dbExceptions[0]?.isException).toBe(true);
		expect(dbExceptions[0]?.recurringEventInstanceId).toBe(targetInstanceId);
		expect(dbExceptions[0]?.createdBy).toBe(creatorId);
	});

	test("Integration: Reuses existing volunteer with THIS_INSTANCE_ONLY scope", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: creatorId } = await ensureAdminAuth();
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: creatorId,
					organizationId: organization.orgId,
					role: "administrator",
				},
			},
		});

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

		// Setup recurring event
		const startAt = new Date("2024-12-01T10:00:00Z");
		const endAt = new Date("2024-12-01T12:00:00Z");

		const [template] = await server.drizzleClient
			.insert(eventsTable)
			.values({
				name: "Daily Standup",
				description: "Daily team standup meeting",
				startAt,
				endAt,
				organizationId: organization.orgId,
				creatorId,
				isPublic: true,
				isRegisterable: true,
				isRecurringEventTemplate: true,
			})
			.returning();

		assertToBeNonNullish(template);

		const [recurrenceRule] = await server.drizzleClient
			.insert(recurrenceRulesTable)
			.values({
				baseRecurringEventId: template.id,
				frequency: "DAILY",
				interval: 1,
				count: 2,
				organizationId: organization.orgId,
				creatorId,
				recurrenceRuleString: "RRULE:FREQ=DAILY;INTERVAL=1;COUNT=2",
				recurrenceStartDate: startAt,
				latestInstanceDate: startAt,
			})
			.returning();

		assertToBeNonNullish(recurrenceRule);

		const instances = await server.drizzleClient
			.insert(recurringEventInstancesTable)
			.values([
				{
					baseRecurringEventId: template.id,
					recurrenceRuleId: recurrenceRule.id,
					originalSeriesId: template.id,
					originalInstanceStartTime: startAt,
					actualStartTime: startAt,
					actualEndTime: endAt,
					organizationId: organization.orgId,
					sequenceNumber: 1,
					totalCount: 2,
				},
				{
					baseRecurringEventId: template.id,
					recurrenceRuleId: recurrenceRule.id,
					originalSeriesId: template.id,
					originalInstanceStartTime: new Date("2024-12-02T10:00:00Z"),
					actualStartTime: new Date("2024-12-02T10:00:00Z"),
					actualEndTime: new Date("2024-12-02T12:00:00Z"),
					organizationId: organization.orgId,
					sequenceNumber: 2,
					totalCount: 2,
				},
			])
			.returning();

		expect(instances).toHaveLength(2);

		// Create existing volunteer first using ENTIRE_SERIES
		const firstVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						userId: testUser.userId,
						eventId: template.id,
						scope: "ENTIRE_SERIES",
					},
				},
			},
		);

		expect(firstVolunteerResult.errors).toBeUndefined();
		assertToBeNonNullish(firstVolunteerResult.data?.createEventVolunteer);

		// Now test THIS_INSTANCE_ONLY with existing volunteer (should reuse)
		const instanceVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						userId: testUser.userId,
						eventId: template.id,
						scope: "THIS_INSTANCE_ONLY",
						recurringEventInstanceId: instances[0]?.id,
					},
				},
			},
		);

		expect(instanceVolunteerResult.errors).toBeUndefined();
		expect(instanceVolunteerResult.data).toBeDefined();
		assertToBeNonNullish(instanceVolunteerResult.data);
		assertToBeNonNullish(instanceVolunteerResult.data.createEventVolunteer);

		const volunteer = instanceVolunteerResult.data.createEventVolunteer;
		// Should reuse the same volunteer ID from first creation
		expect(volunteer.id).toBe(
			firstVolunteerResult.data.createEventVolunteer.id,
		);
		expect(volunteer.user?.id).toBe(testUser.userId);
		expect(volunteer.event?.id).toBe(template.id);

		// Verify exception was created for target instance
		assertToBeNonNullish(volunteer.id);
		const dbExceptions = await server.drizzleClient
			.select()
			.from(eventVolunteerExceptionsTable)
			.where(eq(eventVolunteerExceptionsTable.volunteerId, volunteer.id));

		expect(dbExceptions).toHaveLength(1); // One exception for target instance
		expect(dbExceptions[0]?.isException).toBe(true);
		expect(dbExceptions[0]?.recurringEventInstanceId).toBe(instances[0]?.id);
	});

	test("Integration: ENTIRE_SERIES scope removes existing instance-specific volunteers (template exists)", async () => {
		// Test to cover: Removal of instance-specific volunteers when template already exists
		await new Promise((resolve) => setTimeout(resolve, 2000));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: creatorId } = await ensureAdminAuth();
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: creatorId,
					organizationId: organization.orgId,
					role: "administrator",
				},
			},
		});

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

		// Setup recurring event
		const startAt = new Date("2024-12-01T10:00:00Z");
		const endAt = new Date("2024-12-01T12:00:00Z");

		const [template] = await server.drizzleClient
			.insert(eventsTable)
			.values({
				name: "Weekly Standup",
				description: "Daily team standup",
				startAt,
				endAt,
				organizationId: organization.orgId,
				creatorId,
				isPublic: true,
				isRegisterable: true,
				isRecurringEventTemplate: true,
			})
			.returning();

		assertToBeNonNullish(template);

		const [recurrenceRule] = await server.drizzleClient
			.insert(recurrenceRulesTable)
			.values({
				baseRecurringEventId: template.id,
				frequency: "DAILY",
				interval: 1,
				count: 3,
				organizationId: organization.orgId,
				creatorId,
				recurrenceRuleString: "RRULE:FREQ=DAILY;INTERVAL=1;COUNT=3",
				recurrenceStartDate: startAt,
				latestInstanceDate: startAt,
			})
			.returning();

		assertToBeNonNullish(recurrenceRule);

		const instances = await server.drizzleClient
			.insert(recurringEventInstancesTable)
			.values([
				{
					baseRecurringEventId: template.id,
					recurrenceRuleId: recurrenceRule.id,
					originalSeriesId: template.id,
					originalInstanceStartTime: startAt,
					actualStartTime: startAt,
					actualEndTime: endAt,
					organizationId: organization.orgId,
					sequenceNumber: 1,
					totalCount: 3,
				},
				{
					baseRecurringEventId: template.id,
					recurrenceRuleId: recurrenceRule.id,
					originalSeriesId: template.id,
					originalInstanceStartTime: new Date("2024-12-02T10:00:00Z"),
					actualStartTime: new Date("2024-12-02T10:00:00Z"),
					actualEndTime: new Date("2024-12-02T12:00:00Z"),
					organizationId: organization.orgId,
					sequenceNumber: 2,
					totalCount: 3,
				},
			])
			.returning();

		expect(instances).toHaveLength(2);

		// First create a template volunteer
		const templateVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						userId: testUser.userId,
						eventId: template.id,
						scope: "ENTIRE_SERIES",
					},
				},
			},
		);

		expect(templateVolunteerResult.errors).toBeUndefined();
		expect(templateVolunteerResult.data?.createEventVolunteer).toBeDefined();

		// Create instance-specific volunteers directly in database (simulating existing data)
		const [instanceVolunteer1] = await server.drizzleClient
			.insert(eventVolunteersTable)
			.values({
				userId: testUser.userId,
				eventId: template.id,
				creatorId,
				hasAccepted: false,
				isPublic: true,
				hoursVolunteered: "0",
				isTemplate: false,
				recurringEventInstanceId: instances[0]?.id,
			})
			.returning();

		const [instanceVolunteer2] = await server.drizzleClient
			.insert(eventVolunteersTable)
			.values({
				userId: testUser.userId,
				eventId: template.id,
				creatorId,
				hasAccepted: false,
				isPublic: true,
				hoursVolunteered: "0",
				isTemplate: false,
				recurringEventInstanceId: instances[1]?.id,
			})
			.returning();

		assertToBeNonNullish(instanceVolunteer1);
		assertToBeNonNullish(instanceVolunteer2);

		// Create volunteer memberships for instance-specific volunteers
		await server.drizzleClient.insert(volunteerMembershipsTable).values([
			{
				volunteerId: instanceVolunteer1.id,
				groupId: null,
				eventId: template.id,
				status: "invited",
				createdBy: creatorId,
			},
			{
				volunteerId: instanceVolunteer2.id,
				groupId: null,
				eventId: template.id,
				status: "invited",
				createdBy: creatorId,
			},
		]);

		// Verify instance-specific volunteers exist
		const instanceVolunteersBefore = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(
				and(
					eq(eventVolunteersTable.userId, testUser.userId),
					eq(eventVolunteersTable.eventId, template.id),
					eq(eventVolunteersTable.isTemplate, false),
				),
			);

		expect(instanceVolunteersBefore).toHaveLength(2);

		// Now create ENTIRE_SERIES volunteer again - should find existing template and remove instance-specific ones
		const entireSeriesResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						userId: testUser.userId,
						eventId: template.id,
						scope: "ENTIRE_SERIES",
					},
				},
			},
		);

		expect(entireSeriesResult.errors).toBeUndefined();
		expect(entireSeriesResult.data?.createEventVolunteer).toBeDefined();

		// Should reuse the same volunteer ID from first creation
		expect(entireSeriesResult.data?.createEventVolunteer?.id).toBe(
			templateVolunteerResult.data?.createEventVolunteer?.id,
		);

		// Verify instance-specific volunteers were removed
		const instanceVolunteersAfter = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(
				and(
					eq(eventVolunteersTable.userId, testUser.userId),
					eq(eventVolunteersTable.eventId, template.id),
					eq(eventVolunteersTable.isTemplate, false),
				),
			);

		expect(instanceVolunteersAfter).toHaveLength(0); // Should be removed

		// Verify template volunteer still exists
		const templateVolunteers = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(
				and(
					eq(eventVolunteersTable.userId, testUser.userId),
					eq(eventVolunteersTable.eventId, template.id),
					eq(eventVolunteersTable.isTemplate, true),
				),
			);

		expect(templateVolunteers).toHaveLength(1);
		expect(templateVolunteers[0]?.id).toBe(
			templateVolunteerResult.data?.createEventVolunteer?.id,
		);
	});

	test("Integration: ENTIRE_SERIES scope removes existing instance-specific volunteers (new template)", async () => {
		// Test to cover: Removal of instance-specific volunteers when creating new template
		await new Promise((resolve) => setTimeout(resolve, 2200));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: creatorId } = await ensureAdminAuth();
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: creatorId,
					organizationId: organization.orgId,
					role: "administrator",
				},
			},
		});

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

		// Setup recurring event
		const startAt = new Date("2024-12-01T10:00:00Z");
		const endAt = new Date("2024-12-01T12:00:00Z");

		const [template] = await server.drizzleClient
			.insert(eventsTable)
			.values({
				name: "Monthly Review",
				description: "Monthly team review meeting",
				startAt,
				endAt,
				organizationId: organization.orgId,
				creatorId,
				isPublic: true,
				isRegisterable: true,
				isRecurringEventTemplate: true,
			})
			.returning();

		assertToBeNonNullish(template);

		const [recurrenceRule] = await server.drizzleClient
			.insert(recurrenceRulesTable)
			.values({
				baseRecurringEventId: template.id,
				frequency: "MONTHLY",
				interval: 1,
				count: 2,
				organizationId: organization.orgId,
				creatorId,
				recurrenceRuleString: "RRULE:FREQ=MONTHLY;INTERVAL=1;COUNT=2",
				recurrenceStartDate: startAt,
				latestInstanceDate: startAt,
			})
			.returning();

		assertToBeNonNullish(recurrenceRule);

		const instances = await server.drizzleClient
			.insert(recurringEventInstancesTable)
			.values([
				{
					baseRecurringEventId: template.id,
					recurrenceRuleId: recurrenceRule.id,
					originalSeriesId: template.id,
					originalInstanceStartTime: startAt,
					actualStartTime: startAt,
					actualEndTime: endAt,
					organizationId: organization.orgId,
					sequenceNumber: 1,
					totalCount: 2,
				},
				{
					baseRecurringEventId: template.id,
					recurrenceRuleId: recurrenceRule.id,
					originalSeriesId: template.id,
					originalInstanceStartTime: new Date("2025-01-01T10:00:00Z"),
					actualStartTime: new Date("2025-01-01T10:00:00Z"),
					actualEndTime: new Date("2025-01-01T12:00:00Z"),
					organizationId: organization.orgId,
					sequenceNumber: 2,
					totalCount: 2,
				},
			])
			.returning();

		expect(instances).toHaveLength(2);

		// Create instance-specific volunteers directly in database (simulating existing data)
		const [instanceVolunteer1] = await server.drizzleClient
			.insert(eventVolunteersTable)
			.values({
				userId: testUser.userId,
				eventId: template.id,
				creatorId,
				hasAccepted: false,
				isPublic: true,
				hoursVolunteered: "0",
				isTemplate: false,
				recurringEventInstanceId: instances[0]?.id,
			})
			.returning();

		const [instanceVolunteer2] = await server.drizzleClient
			.insert(eventVolunteersTable)
			.values({
				userId: testUser.userId,
				eventId: template.id,
				creatorId,
				hasAccepted: false,
				isPublic: true,
				hoursVolunteered: "0",
				isTemplate: false,
				recurringEventInstanceId: instances[1]?.id,
			})
			.returning();

		assertToBeNonNullish(instanceVolunteer1);
		assertToBeNonNullish(instanceVolunteer2);

		// Create volunteer memberships for instance-specific volunteers
		await server.drizzleClient.insert(volunteerMembershipsTable).values([
			{
				volunteerId: instanceVolunteer1.id,
				groupId: null,
				eventId: template.id,
				status: "invited",
				createdBy: creatorId,
			},
			{
				volunteerId: instanceVolunteer2.id,
				groupId: null,
				eventId: template.id,
				status: "invited",
				createdBy: creatorId,
			},
		]);

		// Verify instance-specific volunteers exist
		const instanceVolunteersBefore = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(
				and(
					eq(eventVolunteersTable.userId, testUser.userId),
					eq(eventVolunteersTable.eventId, template.id),
					eq(eventVolunteersTable.isTemplate, false),
				),
			);

		expect(instanceVolunteersBefore).toHaveLength(2);

		// Now create ENTIRE_SERIES volunteer - should remove instance-specific ones and create new template
		const entireSeriesResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						userId: testUser.userId,
						eventId: template.id,
						scope: "ENTIRE_SERIES",
					},
				},
			},
		);

		expect(entireSeriesResult.errors).toBeUndefined();
		expect(entireSeriesResult.data?.createEventVolunteer).toBeDefined();

		// Verify instance-specific volunteers were removed
		const instanceVolunteersAfter = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(
				and(
					eq(eventVolunteersTable.userId, testUser.userId),
					eq(eventVolunteersTable.eventId, template.id),
					eq(eventVolunteersTable.isTemplate, false),
				),
			);

		expect(instanceVolunteersAfter).toHaveLength(0); // Should be removed

		// Verify new template volunteer was created
		const templateVolunteers = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(
				and(
					eq(eventVolunteersTable.userId, testUser.userId),
					eq(eventVolunteersTable.eventId, template.id),
					eq(eventVolunteersTable.isTemplate, true),
				),
			);

		expect(templateVolunteers).toHaveLength(1);
		expect(templateVolunteers[0]?.id).toBe(
			entireSeriesResult.data?.createEventVolunteer?.id,
		);
	});

	test("Integration: Input validation error triggers proper error mapping", async () => {
		// Test to cover: if (!success) validation error handling with issues mapping
		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		// Test with invalid UUID format to trigger validation failure
		const createEventVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						userId: "invalid-uuid-format", // This should trigger validation error
						eventId: faker.string.uuid(),
					},
				},
			},
		);

		// This should cover the validation error handling path:
		// if (!success) -> throw new TalawaGraphQLError with issues mapping
		expect(createEventVolunteerResult.errors).toBeDefined();
		expect(createEventVolunteerResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: expect.any(Array), // issue.path.map(String)
								message: expect.any(String), // issue.message
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("Integration: Multiple validation errors trigger comprehensive error mapping", async () => {
		// Test to cover error.issues.map() with multiple validation issues
		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		// Test with multiple invalid fields to trigger multiple validation issues
		const createEventVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						userId: "invalid-user-uuid", // First validation issue
						eventId: "invalid-event-uuid", // Second validation issue
						scope: "THIS_INSTANCE_ONLY",
						// Missing recurringEventInstanceId - Third validation issue
					},
				},
			},
		);

		// This should trigger the comprehensive error mapping:
		// error.issues.map((issue) => ({ argumentPath: issue.path.map(String), message: issue.message }))
		expect(createEventVolunteerResult.errors).toBeDefined();
		expect(createEventVolunteerResult.errors).toEqual(
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
				}),
			]),
		);

		// Verify that issues array has been properly mapped from validation errors
		const errorExtensions = createEventVolunteerResult.errors?.[0]?.extensions;
		expect(errorExtensions).toHaveProperty("issues");
		expect(Array.isArray(errorExtensions?.issues)).toBe(true);
	});

	test("Integration: User not found triggers specific error handling", async () => {
		// Test to cover: if (!user) error handling with specific argumentPath
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();
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

		// Use a valid UUID format but non-existent user to trigger if (!user) path
		const nonExistentUserId = faker.string.uuid();

		const createEventVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						userId: nonExistentUserId, // Valid format but user doesn't exist
						eventId: event.eventId,
					},
				},
			},
		);

		// This should cover the exact error handling lines:
		// if (!user) {
		//   throw new TalawaGraphQLError({
		//     extensions: {
		//       code: "arguments_associated_resources_not_found",
		//       issues: [{ argumentPath: ["data", "userId"] }]
		//     }
		//   });
		// }
		expect(createEventVolunteerResult.errors).toBeDefined();
		expect(createEventVolunteerResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["data", "userId"],
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("Integration: Event not found triggers specific error handling", async () => {
		// Test to cover: if (!targetEvent) error handling with eventId argumentPath
		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		// Use a valid UUID format but non-existent event to trigger if (!targetEvent) path
		const nonExistentEventId = faker.string.uuid();

		const createEventVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						userId: testUser.userId, // Valid existing user
						eventId: nonExistentEventId, // Valid format but event doesn't exist
					},
				},
			},
		);

		// This should cover the exact error handling lines:
		// if (!targetEvent) {
		//   throw new TalawaGraphQLError({
		//     extensions: {
		//       code: "arguments_associated_resources_not_found",
		//       issues: [{ argumentPath: ["data", "eventId"] }]
		//     }
		//   });
		// }
		expect(createEventVolunteerResult.errors).toBeDefined();
		expect(createEventVolunteerResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["data", "eventId"],
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("Integration: THIS_INSTANCE_ONLY scope validation - missing recurringEventInstanceId", async () => {
		// Test to cover: if (scope === "THIS_INSTANCE_ONLY") {
		//   if (!recurringInstance || !parsedArgs.data.recurringEventInstanceId) {
		await new Promise((resolve) => setTimeout(resolve, 3000));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();
		await new Promise((resolve) => setTimeout(resolve, 400));

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

		await new Promise((resolve) => setTimeout(resolve, 300));
		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		// Test: scope === "THIS_INSTANCE_ONLY" with missing recurringEventInstanceId
		const createEventVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						userId: testUser.userId,
						eventId: event.eventId,
						scope: "THIS_INSTANCE_ONLY",
						// Missing recurringEventInstanceId - triggers validation
					},
				},
			},
		);

		// This should cover the exact lines:
		// if (scope === "THIS_INSTANCE_ONLY") {
		//   if (!recurringInstance || !parsedArgs.data.recurringEventInstanceId) {
		//     throw new TalawaGraphQLError({
		//       extensions: {
		//         code: "invalid_arguments",
		//         issues: [{
		//           argumentPath: ["data", "recurringEventInstanceId"],
		//           message: "recurringEventInstanceId is required for THIS_INSTANCE_ONLY scope"
		//         }]
		//       }
		//     });
		//   }
		// }
		expect(createEventVolunteerResult.errors).toBeDefined();
		expect(createEventVolunteerResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["data", "recurringEventInstanceId"],
								message:
									"recurringEventInstanceId is required for THIS_INSTANCE_ONLY scope",
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("Integration: THIS_INSTANCE_ONLY scope validation - non-existent recurringEventInstanceId", async () => {
		// Test to cover the !recurringInstance part of the validation
		await new Promise((resolve) => setTimeout(resolve, 3500));

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();
		await new Promise((resolve) => setTimeout(resolve, 400));

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

		await new Promise((resolve) => setTimeout(resolve, 300));
		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		// Test: scope === "THIS_INSTANCE_ONLY" with provided but non-existent recurringEventInstanceId
		// This should make recurringInstance null/undefined
		const createEventVolunteerResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteer,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						userId: testUser.userId,
						eventId: event.eventId,
						scope: "THIS_INSTANCE_ONLY",
						recurringEventInstanceId: faker.string.uuid(), // Valid format but doesn't exist
					},
				},
			},
		);

		// This covers the same validation path but for !recurringInstance condition:
		// if (!recurringInstance || !parsedArgs.data.recurringEventInstanceId) {
		expect(createEventVolunteerResult.errors).toBeDefined();
		expect(createEventVolunteerResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["data", "recurringEventInstanceId"],
								message:
									"recurringEventInstanceId is required for THIS_INSTANCE_ONLY scope",
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);
	});
});
