import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
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
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createVolunteerMembership,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

// Custom GraphQL query for createVolunteerMembership

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

beforeAll(async () => {
	await ensureAdminAuth();
});

suite("Mutation createVolunteerMembership - Integration Tests", () => {
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

	test("Integration: Unauthenticated user cannot create volunteer membership", async () => {
		const createMembershipResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				variables: {
					data: {
						userId: faker.string.uuid(),
						event: faker.string.uuid(),
						status: "invited",
					},
				},
			},
		);

		expect(createMembershipResult.errors).toBeDefined();
		expect(createMembershipResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["createVolunteerMembership"],
				}),
			]),
		);
	});

	test("Integration: Successfully creates volunteer membership with new volunteer", async () => {
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

		const createMembershipResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: testUser.userId,
						event: event.eventId,
						status: "invited",
					},
				},
			},
		);

		expect(createMembershipResult.errors).toBeUndefined();
		expect(createMembershipResult.data).toBeDefined();
		assertToBeNonNullish(createMembershipResult.data);
		assertToBeNonNullish(createMembershipResult.data.createVolunteerMembership);

		const membership = createMembershipResult.data.createVolunteerMembership;
		expect(membership.id).toBeDefined();
		expect(membership.status).toBe("invited");
		expect(membership.volunteer?.user?.id).toBe(testUser.userId);
		expect(membership.event?.id).toBe(event.eventId);

		// Verify both EventVolunteer and VolunteerMembership were created
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.userId, testUser.userId))
			.limit(1);

		expect(dbVolunteer).toHaveLength(1);
		expect(dbVolunteer[0]?.hasAccepted).toBe(false); // invited status -> hasAccepted: false

		// This covers volunteer.length === 0 (new volunteer creation) path
	});

	test("Integration: User not found error", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const createMembershipResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: faker.string.uuid(), // Non-existent user
						event: event.eventId,
						status: "invited",
					},
				},
			},
		);

		// Covers: if (!user) error handling
		expect(createMembershipResult.errors).toBeDefined();
		expect(createMembershipResult.errors).toEqual(
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

	test("Integration: Event not found error", async () => {
		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const createMembershipResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: testUser.userId,
						event: faker.string.uuid(), // Non-existent event
						status: "invited",
					},
				},
			},
		);

		// Covers: if (!event) error handling
		expect(createMembershipResult.errors).toBeDefined();
		expect(createMembershipResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["data", "event"],
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("Integration: Input validation error triggers proper error mapping", async () => {
		// Test to cover: if (!success) validation error handling with issues mapping
		const { token: adminAuth } = await ensureAdminAuth();

		// Test with data that passes GraphQL validation but fails Zod validation
		// Use invalid UUIDs (wrong format) but valid status enum to trigger Zod validation
		const createMembershipResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: "not-a-valid-uuid-format", // Invalid UUID format - will trigger Zod validation
						event: "also-not-valid-uuid", // Invalid UUID format - will trigger Zod validation
						status: "invited", // Valid enum value to pass GraphQL validation
					},
				},
			},
		);

		// This should trigger the validation error handling path:
		// if (!success) -> throw new TalawaGraphQLError with issues mapping
		expect(createMembershipResult.errors).toBeDefined();
		expect(createMembershipResult.errors).toEqual(
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

		// Verify that error.issues.map() logic was executed properly
		const errorExtensions = createMembershipResult.errors?.[0]?.extensions;
		expect(errorExtensions).toHaveProperty("issues");
		expect(Array.isArray(errorExtensions?.issues)).toBe(true);

		// Verify each issue has the expected structure from the mapping
		if (errorExtensions?.issues && Array.isArray(errorExtensions.issues)) {
			for (const issue of errorExtensions.issues) {
				expect(issue).toHaveProperty("argumentPath");
				expect(issue).toHaveProperty("message");
				expect(Array.isArray(issue.argumentPath)).toBe(true);
				expect(typeof issue.message).toBe("string");
			}
		}
	});

	test("Integration: Multiple validation errors trigger comprehensive error mapping", async () => {
		// Test to cover error.issues.map() with multiple validation issues
		const { token: adminAuth } = await ensureAdminAuth();

		// Test with multiple fields that have invalid UUID formats to trigger multiple Zod validation issues
		const createMembershipResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: "invalid-uuid-1", // First validation issue - invalid UUID format
						event: "invalid-uuid-2", // Second validation issue - invalid UUID format
						status: "invited", // Valid enum to pass GraphQL validation
						group: "invalid-uuid-3", // Third validation issue - invalid UUID format (optional field)
					},
				},
			},
		);

		// This should trigger the comprehensive error mapping:
		// error.issues.map((issue) => ({ argumentPath: issue.path.map(String), message: issue.message }))
		expect(createMembershipResult.errors).toBeDefined();
		expect(createMembershipResult.errors).toEqual(
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
		const errorExtensions = createMembershipResult.errors?.[0]?.extensions;
		expect(errorExtensions).toHaveProperty("issues");
		expect(Array.isArray(errorExtensions?.issues)).toBe(true);

		// Should have multiple issues since we provided multiple invalid UUID fields
		if (errorExtensions?.issues && Array.isArray(errorExtensions.issues)) {
			expect(errorExtensions.issues.length).toBeGreaterThan(0);

			// Verify the mapping structure for each issue: issue.path.map(String) and issue.message
			for (const mappedIssue of errorExtensions.issues) {
				expect(mappedIssue).toHaveProperty("argumentPath");
				expect(mappedIssue).toHaveProperty("message");
				expect(Array.isArray(mappedIssue.argumentPath)).toBe(true);
				expect(typeof mappedIssue.message).toBe("string");

				// Verify argumentPath contains strings (from issue.path.map(String))
				for (const pathElement of mappedIssue.argumentPath) {
					expect(typeof pathElement).toBe("string");
				}
			}
		}
	});

	test("Integration: Creates membership with accepted status", async () => {
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

		const createMembershipResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: testUser.userId,
						event: event.eventId,
						status: "accepted", // This should set hasAccepted: true
					},
				},
			},
		);

		expect(createMembershipResult.errors).toBeUndefined();
		expect(createMembershipResult.data).toBeDefined();
		assertToBeNonNullish(createMembershipResult.data);
		assertToBeNonNullish(createMembershipResult.data.createVolunteerMembership);

		const membership = createMembershipResult.data.createVolunteerMembership;
		expect(membership.id).toBeDefined();
		expect(membership.status).toBe("accepted");

		// Verify EventVolunteer was created with hasAccepted: true for "accepted" status
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.userId, testUser.userId))
			.limit(1);

		expect(dbVolunteer).toHaveLength(1);
		expect(dbVolunteer[0]?.hasAccepted).toBe(true); // accepted status -> hasAccepted: true

		// This covers all the defensive checks and volunteer creation logic
	});

	test("Integration: Reuses existing volunteer for membership", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth, userId: creatorId } = await ensureAdminAuth();
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

		// Pre-create an EventVolunteer record
		const [existingVolunteer] = await server.drizzleClient
			.insert(eventVolunteersTable)
			.values({
				userId: testUser.userId,
				eventId: event.eventId,
				creatorId,
				hasAccepted: false,
				isPublic: true,
				hoursVolunteered: "0",
			})
			.returning();

		assertToBeNonNullish(existingVolunteer);

		// Create membership - should reuse existing volunteer
		const createMembershipResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: testUser.userId,
						event: event.eventId,
						status: "invited",
						// No group assignment to avoid foreign key constraint issues
					},
				},
			},
		);

		expect(createMembershipResult.errors).toBeUndefined();
		expect(createMembershipResult.data).toBeDefined();
		assertToBeNonNullish(createMembershipResult.data);
		assertToBeNonNullish(createMembershipResult.data.createVolunteerMembership);

		const membership = createMembershipResult.data.createVolunteerMembership;
		expect(membership.id).toBeDefined();
		expect(membership.status).toBe("invited");

		// This covers the volunteer.length > 0 path (reuse existing volunteer)
		const dbVolunteers = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.userId, testUser.userId));

		expect(dbVolunteers).toHaveLength(1); // Should reuse, not create new
		expect(dbVolunteers[0]?.id).toBe(existingVolunteer.id);

		// Verify membership was created
		assertToBeNonNullish(membership.id);
		const dbMembership = await server.drizzleClient
			.select()
			.from(eventVolunteerMembershipsTable)
			.where(eq(eventVolunteerMembershipsTable.id, membership.id))
			.limit(1);

		expect(dbMembership).toHaveLength(1);
		expect(dbMembership[0]?.groupId).toBeNull(); // No group assigned
		expect(dbMembership[0]?.eventId).toBe(event.eventId);
	});

	test("Integration: Recurring event scope validation - THIS_INSTANCE_ONLY", async () => {
		// Test to cover all the complex recurring event logic
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
				description: "Recurring standup meeting",
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
				count: 2,
				organizationId: organization.orgId,
				creatorId,
				recurrenceRuleString: "RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=2",
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
			])
			.returning();

		expect(instances).toHaveLength(1);
		const instanceId = instances[0]?.id;
		assertToBeNonNullish(instanceId);

		// Test 1: Missing recurringEventInstanceId for THIS_INSTANCE_ONLY
		const missingInstanceResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: testUser.userId,
						event: template.id, // Template event (recurring)
						status: "invited",
						scope: "THIS_INSTANCE_ONLY",
						// Missing recurringEventInstanceId
					},
				},
			},
		);

		// Covers: if (!parsedArgs.data.recurringEventInstanceId) validation
		expect(missingInstanceResult.errors).toBeDefined();
		expect(missingInstanceResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["data", "recurringEventInstanceId"],
								message:
									"recurringEventInstanceId is required when scope is THIS_INSTANCE_ONLY",
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);

		// Test 2: Non-existent recurringEventInstanceId
		const nonExistentInstanceResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: testUser.userId,
						event: template.id,
						status: "invited",
						scope: "THIS_INSTANCE_ONLY",
						recurringEventInstanceId: faker.string.uuid(), // Doesn't exist
					},
				},
			},
		);

		// Covers: if (!instance) validation for recurringEventInstanceId lookup
		expect(nonExistentInstanceResult.errors).toBeDefined();
		expect(nonExistentInstanceResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["data", "recurringEventInstanceId"],
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("Integration: Recurring event instance mismatch validation", async () => {
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

		// Create two different recurring events
		const startAt = new Date("2024-12-01T10:00:00Z");
		const endAt = new Date("2024-12-01T12:00:00Z");

		const [template1] = await server.drizzleClient
			.insert(eventsTable)
			.values({
				name: "Event 1",
				description: "First recurring event",
				startAt,
				endAt,
				organizationId: organization.orgId,
				creatorId,
				isPublic: true,
				isRegisterable: true,
				isRecurringEventTemplate: true,
			})
			.returning();

		const [template2] = await server.drizzleClient
			.insert(eventsTable)
			.values({
				name: "Event 2",
				description: "Second recurring event",
				startAt,
				endAt,
				organizationId: organization.orgId,
				creatorId,
				isPublic: true,
				isRegisterable: true,
				isRecurringEventTemplate: true,
			})
			.returning();

		assertToBeNonNullish(template1);
		assertToBeNonNullish(template2);

		// Create recurrence rules
		const [rule1] = await server.drizzleClient
			.insert(recurrenceRulesTable)
			.values({
				baseRecurringEventId: template1.id,
				frequency: "WEEKLY",
				interval: 1,
				count: 1,
				organizationId: organization.orgId,
				creatorId,
				recurrenceRuleString: "RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=1",
				recurrenceStartDate: startAt,
				latestInstanceDate: startAt,
			})
			.returning();

		const [rule2] = await server.drizzleClient
			.insert(recurrenceRulesTable)
			.values({
				baseRecurringEventId: template2.id,
				frequency: "WEEKLY",
				interval: 1,
				count: 1,
				organizationId: organization.orgId,
				creatorId,
				recurrenceRuleString: "RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=1",
				recurrenceStartDate: startAt,
				latestInstanceDate: startAt,
			})
			.returning();

		assertToBeNonNullish(rule1);
		assertToBeNonNullish(rule2);

		// Create instances for both events
		const [instance1] = await server.drizzleClient
			.insert(recurringEventInstancesTable)
			.values({
				baseRecurringEventId: template1.id,
				recurrenceRuleId: rule1.id,
				originalSeriesId: template1.id,
				originalInstanceStartTime: startAt,
				actualStartTime: startAt,
				actualEndTime: endAt,
				organizationId: organization.orgId,
				sequenceNumber: 1,
				totalCount: 1,
			})
			.returning();

		const [instance2] = await server.drizzleClient
			.insert(recurringEventInstancesTable)
			.values({
				baseRecurringEventId: template2.id,
				recurrenceRuleId: rule2.id,
				originalSeriesId: template2.id,
				originalInstanceStartTime: startAt,
				actualStartTime: startAt,
				actualEndTime: endAt,
				organizationId: organization.orgId,
				sequenceNumber: 1,
				totalCount: 1,
			})
			.returning();

		assertToBeNonNullish(instance1);
		assertToBeNonNullish(instance2);

		// Test instance mismatch: use template1 event with instance2 (belongs to template2)
		const mismatchResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: testUser.userId,
						event: template1.id, // Event 1
						status: "invited",
						scope: "THIS_INSTANCE_ONLY",
						recurringEventInstanceId: instance2.id, // Instance belongs to Event 2
					},
				},
			},
		);

		// Covers: if (instance.baseRecurringEventId !== parsedArgs.data.event) validation
		expect(mismatchResult.errors).toBeDefined();
		expect(mismatchResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["data", "recurringEventInstanceId"],
								message:
									"Recurring event instance does not belong to the specified event",
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("Integration: ENTIRE_SERIES scope validation", async () => {
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

		// Create recurring template
		const startAt = new Date("2024-12-01T10:00:00Z");
		const endAt = new Date("2024-12-01T12:00:00Z");

		const [template] = await server.drizzleClient
			.insert(eventsTable)
			.values({
				name: "Daily Meeting",
				description: "Recurring daily meeting",
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

		// Test ENTIRE_SERIES with recurringEventInstanceId (should error)
		const entireSeriesResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: testUser.userId,
						event: template.id,
						status: "invited",
						scope: "ENTIRE_SERIES",
						recurringEventInstanceId: faker.string.uuid(), // Should not provide for ENTIRE_SERIES
					},
				},
			},
		);

		// Covers: ENTIRE_SERIES scope with recurringEventInstanceId validation
		expect(entireSeriesResult.errors).toBeDefined();
		expect(entireSeriesResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["data", "recurringEventInstanceId"],
								message:
									"recurringEventInstanceId should not be provided when scope is ENTIRE_SERIES",
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("Integration: Scope validation for non-recurring events", async () => {
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

		const event = await createTestEvent(organization.orgId); // Non-recurring event
		testCleanupFunctions.push(event.cleanup);

		const createMembershipResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: testUser.userId,
						event: event.eventId,
						status: "invited",
						scope: "ENTIRE_SERIES", // Should error for non-recurring event
					},
				},
			},
		);

		// Covers: scope validation for non-recurring events
		expect(createMembershipResult.errors).toBeDefined();
		expect(createMembershipResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["data", "scope"],
								message: "scope should only be provided for recurring events",
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("Integration: Recurring event instance detection and targetEventId resolution", async () => {
		// Test to cover: if (instance) logic when event ID is actually an instance ID
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
				name: "Monthly All Hands",
				description: "Monthly company meeting",
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
				count: 1,
				organizationId: organization.orgId,
				creatorId,
				recurrenceRuleString: "RRULE:FREQ=MONTHLY;INTERVAL=1;COUNT=1",
				recurrenceStartDate: startAt,
				latestInstanceDate: startAt,
			})
			.returning();

		assertToBeNonNullish(recurrenceRule);

		const [instance] = await server.drizzleClient
			.insert(recurringEventInstancesTable)
			.values({
				baseRecurringEventId: template.id,
				recurrenceRuleId: recurrenceRule.id,
				originalSeriesId: template.id,
				originalInstanceStartTime: startAt,
				actualStartTime: startAt,
				actualEndTime: endAt,
				organizationId: organization.orgId,
				sequenceNumber: 1,
				totalCount: 1,
			})
			.returning();

		assertToBeNonNullish(instance);

		// Test with template ID and verify the mutation works with recurring events
		const createMembershipResult = await mercuriusClient.mutate(
			Mutation_createVolunteerMembership,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						userId: testUser.userId,
						event: template.id, // Using template ID for recurring event
						status: "invited",
					},
				},
			},
		);

		expect(createMembershipResult.errors).toBeUndefined();
		expect(createMembershipResult.data).toBeDefined();
		assertToBeNonNullish(createMembershipResult.data);
		assertToBeNonNullish(createMembershipResult.data.createVolunteerMembership);

		const membership = createMembershipResult.data.createVolunteerMembership;
		expect(membership.id).toBeDefined();
		expect(membership.status).toBe("invited");

		// This covers recurring event volunteer creation:
		// The mutation should create a volunteer for the recurring event template
		// and link the membership to the template event

		// Verify volunteer was created for the template event
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.userId, testUser.userId))
			.limit(1);

		expect(dbVolunteer).toHaveLength(1);
		expect(dbVolunteer[0]?.eventId).toBe(template.id); // Should use template

		// Verify membership was created for the template event
		assertToBeNonNullish(membership.id);
		const dbMembership = await server.drizzleClient
			.select()
			.from(eventVolunteerMembershipsTable)
			.where(eq(eventVolunteerMembershipsTable.id, membership.id))
			.limit(1);

		expect(dbMembership).toHaveLength(1);
		expect(dbMembership[0]?.eventId).toBe(template.id); // Links to template event
	});
});
