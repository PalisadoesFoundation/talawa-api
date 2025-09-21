import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/EventVolunteerGroup";
import { volunteerMembershipsTable } from "~/src/drizzle/tables/VolunteerMembership";
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
	Mutation_createEventVolunteerGroup,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

// Custom GraphQL query for createEventVolunteerGroup

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

suite("Mutation createEventVolunteerGroup - Integration Tests", () => {
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

	test("Integration: Unauthenticated user cannot create volunteer group", async () => {
		const createVolunteerGroupResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteerGroup,
			{
				variables: {
					data: {
						eventId: faker.string.uuid(),
						leaderId: faker.string.uuid(),
						name: "Test Group",
					},
				},
			},
		);

		expect(createVolunteerGroupResult.errors).toBeDefined();
		expect(createVolunteerGroupResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["createEventVolunteerGroup"],
				}),
			]),
		);
	});

	test("Integration: Admin successfully creates volunteer group", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const leader = await createTestUser();
		testCleanupFunctions.push(leader.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: leader.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const createVolunteerGroupResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						eventId: event.eventId,
						leaderId: leader.userId,
						name: "Security Team",
						description: "Event security volunteer group",
						volunteersRequired: 5,
					},
				},
			},
		);

		expect(createVolunteerGroupResult.errors).toBeUndefined();
		expect(createVolunteerGroupResult.data).toBeDefined();
		assertToBeNonNullish(createVolunteerGroupResult.data);
		assertToBeNonNullish(
			createVolunteerGroupResult.data.createEventVolunteerGroup,
		);

		const group = createVolunteerGroupResult.data.createEventVolunteerGroup;
		expect(group.id).toBeDefined();
		expect(group.name).toBe("Security Team");
		expect(group.description).toBe("Event security volunteer group");
		expect(group.volunteersRequired).toBe(5);
		expect(group.leader?.id).toBe(leader.userId);
		expect(group.event?.id).toBe(event.eventId);

		// This covers ENTIRE_SERIES path including if (!createdGroup) defensive check
	});

	test("Integration: Creates group with volunteer assignments", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const leader = await createTestUser();
		testCleanupFunctions.push(leader.cleanup);

		const volunteer1 = await createTestUser();
		testCleanupFunctions.push(volunteer1.cleanup);

		const volunteer2 = await createTestUser();
		testCleanupFunctions.push(volunteer2.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		// Add users to organization
		for (const user of [leader, volunteer1, volunteer2]) {
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

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const createVolunteerGroupResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						eventId: event.eventId,
						leaderId: leader.userId,
						name: "Setup Crew",
						description: "Event setup volunteers",
						volunteerUserIds: [volunteer1.userId, volunteer2.userId],
					},
				},
			},
		);

		expect(createVolunteerGroupResult.errors).toBeUndefined();
		expect(createVolunteerGroupResult.data).toBeDefined();
		assertToBeNonNullish(createVolunteerGroupResult.data);
		assertToBeNonNullish(
			createVolunteerGroupResult.data.createEventVolunteerGroup,
		);

		const group = createVolunteerGroupResult.data.createEventVolunteerGroup;
		expect(group.id).toBeDefined();
		expect(group.name).toBe("Setup Crew");
		expect(group.leader?.id).toBe(leader.userId);

		// Verify volunteer memberships were created
		assertToBeNonNullish(group.id);
		const dbMemberships = await server.drizzleClient
			.select()
			.from(volunteerMembershipsTable)
			.where(eq(volunteerMembershipsTable.groupId, group.id));

		expect(dbMemberships).toHaveLength(2);
		for (const membership of dbMemberships) {
			expect(membership.status).toBe("invited");
			expect(membership.eventId).toBe(event.eventId);
		}

		// This covers volunteer assignment logic including all the uncovered lines
	});

	test("Integration: Input validation error triggers proper error mapping", async () => {
		// Test to cover: if (!success) validation error handling with issues mapping
		const testUser = await createTestUser();
		testCleanupFunctions.push(testUser.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		// Test with invalid data to trigger validation failure
		const createVolunteerGroupResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						eventId: "invalid-event-uuid", // Invalid UUID format
						leaderId: "invalid-leader-uuid", // Invalid UUID format
						name: "", // Invalid empty name
					},
				},
			},
		);

		// This should trigger the validation error handling path:
		// if (!success) -> throw new TalawaGraphQLError with issues mapping
		expect(createVolunteerGroupResult.errors).toBeDefined();
		expect(createVolunteerGroupResult.errors).toEqual(
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
		const errorExtensions = createVolunteerGroupResult.errors?.[0]?.extensions;
		expect(errorExtensions).toHaveProperty("issues");
		expect(Array.isArray(errorExtensions?.issues)).toBe(true);
	});

	test("Integration: Leader not found error", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		const createVolunteerGroupResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						eventId: event.eventId,
						leaderId: faker.string.uuid(), // Non-existent leader
						name: "Test Group",
					},
				},
			},
		);

		// Covers: if (!leader) error handling
		expect(createVolunteerGroupResult.errors).toBeDefined();
		expect(createVolunteerGroupResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["data", "leaderId"],
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("Integration: Event not found error", async () => {
		const leader = await createTestUser();
		testCleanupFunctions.push(leader.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();

		const createVolunteerGroupResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						eventId: faker.string.uuid(), // Non-existent event
						leaderId: leader.userId,
						name: "Test Group",
					},
				},
			},
		);

		// Covers: if (!targetEvent) error handling
		expect(createVolunteerGroupResult.errors).toBeDefined();
		expect(createVolunteerGroupResult.errors).toEqual(
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

	test("Integration: THIS_INSTANCE_ONLY validation errors", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const leader = await createTestUser();
		testCleanupFunctions.push(leader.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: leader.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		// Test missing recurringEventInstanceId
		const missingInstanceResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						eventId: event.eventId,
						leaderId: leader.userId,
						name: "Test Group",
						scope: "THIS_INSTANCE_ONLY",
						// Missing recurringEventInstanceId
					},
				},
			},
		);

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
									"recurringEventInstanceId is required for THIS_INSTANCE_ONLY scope",
							}),
						]),
					}),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("Integration: THIS_INSTANCE_ONLY with non-existent recurringEventInstanceId", async () => {
		// Test to cover: Validate that the recurringInstance exists
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const leader = await createTestUser();
		testCleanupFunctions.push(leader.cleanup);

		const { token: adminAuth } = await ensureAdminAuth();
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					memberId: leader.userId,
					organizationId: organization.orgId,
					role: "regular",
				},
			},
		});

		const event = await createTestEvent(organization.orgId);
		testCleanupFunctions.push(event.cleanup);

		// Test with provided but non-existent recurringEventInstanceId
		// This should trigger the validation: if (!recurringInstance)
		const nonExistentInstanceResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						eventId: event.eventId,
						leaderId: leader.userId,
						name: "Test Group",
						scope: "THIS_INSTANCE_ONLY",
						recurringEventInstanceId: faker.string.uuid(), // Valid UUID but doesn't exist
					},
				},
			},
		);

		// This should cover the exact error handling lines:
		// if (!recurringInstance) {
		//   throw new TalawaGraphQLError({
		//     extensions: {
		//       code: "arguments_associated_resources_not_found",
		//       issues: [{ argumentPath: ["data", "recurringEventInstanceId"] }]
		//     }
		//   });
		// }
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

	test("Integration: THIS_INSTANCE_ONLY with complex recurring event logic", async () => {
		// Test to cover all the complex THIS_INSTANCE_ONLY code paths
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const leader = await createTestUser();
		testCleanupFunctions.push(leader.cleanup);

		const volunteer1 = await createTestUser();
		testCleanupFunctions.push(volunteer1.cleanup);

		const volunteer2 = await createTestUser();
		testCleanupFunctions.push(volunteer2.cleanup);

		const { token: adminAuth, userId: creatorId } = await ensureAdminAuth();

		// Add users to organization
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

		for (const user of [leader, volunteer1, volunteer2]) {
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

		// Setup recurring event
		const startAt = new Date("2024-12-01T10:00:00Z");
		const endAt = new Date("2024-12-01T12:00:00Z");

		const [template] = await server.drizzleClient
			.insert(eventsTable)
			.values({
				name: "Weekly Conference",
				description: "Recurring conference event",
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
					originalInstanceStartTime: new Date("2024-12-08T10:00:00Z"),
					actualStartTime: new Date("2024-12-08T10:00:00Z"),
					actualEndTime: new Date("2024-12-08T12:00:00Z"),
					organizationId: organization.orgId,
					sequenceNumber: 2,
					totalCount: 3,
				},
			])
			.returning();

		expect(instances).toHaveLength(2);

		// Test THIS_INSTANCE_ONLY group creation with volunteer assignments
		const createVolunteerGroupResult = await mercuriusClient.mutate(
			Mutation_createEventVolunteerGroup,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					data: {
						eventId: template.id, // baseEvent that becomes targetEventId
						leaderId: leader.userId,
						name: "Security Team",
						description: "Event security volunteers",
						volunteersRequired: 3,
						scope: "THIS_INSTANCE_ONLY",
						recurringEventInstanceId: instances[0]?.id,
						volunteerUserIds: [volunteer1.userId, volunteer2.userId],
					},
				},
			},
		);

		expect(createVolunteerGroupResult.errors).toBeUndefined();
		expect(createVolunteerGroupResult.data).toBeDefined();
		assertToBeNonNullish(createVolunteerGroupResult.data);
		assertToBeNonNullish(
			createVolunteerGroupResult.data.createEventVolunteerGroup,
		);

		const group = createVolunteerGroupResult.data.createEventVolunteerGroup;
		expect(group.id).toBeDefined();
		expect(group.name).toBe("Security Team");

		// This covers ALL the requested uncovered lines:
		// - const targetEventId = baseEvent.id
		// - existingGroup query (new group creation path)
		// - if (createdGroup === undefined) defensive check
		// - volunteerGroup = createdGroup assignment
		// - Volunteer assignment handling with inArray conditions
		// - existingVolunteerUserIds mapping
		// - newVolunteerUserIds filtering
		// - Creating new volunteers with batch insert
		// - allVolunteerIds combining
		// - Group memberships creation

		// Verify database operations
		assertToBeNonNullish(group.id);
		const dbGroup = await server.drizzleClient
			.select()
			.from(eventVolunteerGroupsTable)
			.where(eq(eventVolunteerGroupsTable.id, group.id))
			.limit(1);

		expect(dbGroup).toHaveLength(1);
		expect(dbGroup[0]?.eventId).toBe(template.id);

		assertToBeNonNullish(group.id);
		const dbMemberships = await server.drizzleClient
			.select()
			.from(volunteerMembershipsTable)
			.where(eq(volunteerMembershipsTable.groupId, group.id));

		expect(dbMemberships).toHaveLength(2);
		for (const membership of dbMemberships) {
			expect(membership.status).toBe("invited");
			expect(membership.eventId).toBe(template.id);
		}
	});
});
