import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerGroupExceptionsTable } from "~/src/drizzle/tables/eventVolunteerGroupExceptions";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
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
	Mutation_deleteEventVolunteerGroupForInstance,
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

interface TestEventVolunteerGroup {
	groupId: string;
	cleanup: () => Promise<void>;
}

interface TestRecurringEventSetup {
	templateId: string;
	instanceId: string;
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

async function createRecurringEventSetup(
	organizationId: string,
	creatorId: string,
): Promise<TestRecurringEventSetup> {
	const startAt = new Date("2024-12-01T10:00:00Z");
	const endAt = new Date("2024-12-01T12:00:00Z");

	// Create recurring event template
	const [template] = await server.drizzleClient
		.insert(eventsTable)
		.values({
			name: "Weekly Team Meeting",
			description: "Regular team sync meeting",
			startAt,
			endAt,
			organizationId,
			creatorId,
			isPublic: true,
			isRegisterable: true,
			isRecurringEventTemplate: true,
		})
		.returning();

	assertToBeNonNullish(template);

	// Create recurrence rule
	const [recurrenceRule] = await server.drizzleClient
		.insert(recurrenceRulesTable)
		.values({
			baseRecurringEventId: template.id,
			frequency: "WEEKLY",
			interval: 1,
			count: 2,
			organizationId,
			creatorId,
			recurrenceRuleString: "RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=2",
			recurrenceStartDate: startAt,
			latestInstanceDate: startAt,
		})
		.returning();

	assertToBeNonNullish(recurrenceRule);

	// Create recurring event instance
	const [instance] = await server.drizzleClient
		.insert(recurringEventInstancesTable)
		.values({
			baseRecurringEventId: template.id,
			recurrenceRuleId: recurrenceRule.id,
			originalSeriesId: template.id,
			originalInstanceStartTime: startAt,
			actualStartTime: startAt,
			actualEndTime: endAt,
			organizationId,
			sequenceNumber: 1,
			totalCount: 2,
		})
		.returning();

	assertToBeNonNullish(instance);

	return {
		templateId: template.id,
		instanceId: instance.id,
		cleanup: async () => {
			// Cleanup handled by organization deletion
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

suite(
	"Mutation deleteEventVolunteerGroupForInstance - Integration Tests",
	() => {
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

		test("Integration: Unauthenticated user cannot delete volunteer group for instance", async () => {
			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroupForInstance,
				{
					variables: {
						input: {
							volunteerGroupId: faker.string.uuid(),
							recurringEventInstanceId: faker.string.uuid(),
						},
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
						path: ["deleteEventVolunteerGroupForInstance"],
					}),
				]),
			);
		});

		test("Integration: Input validation error with invalid UUID formats", async () => {
			const { token: adminAuth } = await ensureAdminAuth();

			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroupForInstance,
				{
					headers: {
						authorization: `bearer ${adminAuth}`,
					},
					variables: {
						input: {
							volunteerGroupId: "invalid-uuid-format",
							recurringEventInstanceId: "another-invalid-uuid",
						},
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
						path: ["deleteEventVolunteerGroupForInstance"],
					}),
				]),
			);
		});

		test("Integration: Volunteer group not found error", async () => {
			const organization = await createTestOrganization();
			testCleanupFunctions.push(organization.cleanup);

			const { token: adminAuth, userId: creatorId } = await ensureAdminAuth();

			const recurringSetup = await createRecurringEventSetup(
				organization.orgId,
				creatorId,
			);
			testCleanupFunctions.push(recurringSetup.cleanup);

			const nonExistentGroupId = faker.string.uuid();

			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroupForInstance,
				{
					headers: {
						authorization: `bearer ${adminAuth}`,
					},
					variables: {
						input: {
							volunteerGroupId: nonExistentGroupId,
							recurringEventInstanceId: recurringSetup.instanceId,
						},
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
									argumentPath: ["input", "volunteerGroupId"],
								}),
							]),
						}),
						message: "The specified volunteer group does not exist.",
						path: ["deleteEventVolunteerGroupForInstance"],
					}),
				]),
			);
		});

		test("Integration: Recurring event instance not found error", async () => {
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

			const group = await createTestEventVolunteerGroup(
				event.eventId,
				testUser.userId, // Leader
				creatorId, // Creator
			);
			testCleanupFunctions.push(group.cleanup);

			const nonExistentInstanceId = faker.string.uuid();

			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroupForInstance,
				{
					headers: {
						authorization: `bearer ${adminAuth}`,
					},
					variables: {
						input: {
							volunteerGroupId: group.groupId,
							recurringEventInstanceId: nonExistentInstanceId,
						},
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
									argumentPath: ["input", "recurringEventInstanceId"],
								}),
							]),
						}),
						message: "The specified event instance does not exist.",
						path: ["deleteEventVolunteerGroupForInstance"],
					}),
				]),
			);
		});

		test("Integration: Successfully creates new volunteer group exception (deletion)", async () => {
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

			const recurringSetup = await createRecurringEventSetup(
				organization.orgId,
				creatorId,
			);
			testCleanupFunctions.push(recurringSetup.cleanup);

			const group = await createTestEventVolunteerGroup(
				recurringSetup.templateId,
				testUser.userId, // Leader
				creatorId, // Creator
				"Marketing Team",
				"Team responsible for marketing activities",
				5,
			);
			testCleanupFunctions.push(group.cleanup);

			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroupForInstance,
				{
					headers: {
						authorization: `bearer ${adminAuth}`,
					},
					variables: {
						input: {
							volunteerGroupId: group.groupId,
							recurringEventInstanceId: recurringSetup.instanceId,
						},
					},
				},
			);

			expect(deleteResult.errors).toBeUndefined();
			expect(deleteResult.data).toBeDefined();
			assertToBeNonNullish(deleteResult.data);
			assertToBeNonNullish(
				deleteResult.data.deleteEventVolunteerGroupForInstance,
			);

			const returnedGroup =
				deleteResult.data.deleteEventVolunteerGroupForInstance;
			expect(returnedGroup.id).toBe(group.groupId);
			expect(returnedGroup.name).toBe("Marketing Team");
			expect(returnedGroup.description).toBe(
				"Team responsible for marketing activities",
			);
			expect(returnedGroup.volunteersRequired).toBe(5);
			expect(returnedGroup.leader?.id).toBe(testUser.userId);
			expect(returnedGroup.event?.id).toBe(recurringSetup.templateId);
			expect(returnedGroup.creator?.id).toBe(creatorId);

			// Verify that volunteer group exception was created
			const dbException = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupExceptionsTable)
				.where(
					eq(
						eventVolunteerGroupExceptionsTable.volunteerGroupId,
						group.groupId,
					),
				)
				.limit(1);

			expect(dbException).toHaveLength(1);
			expect(dbException[0]?.volunteerGroupId).toBe(group.groupId);
			expect(dbException[0]?.recurringEventInstanceId).toBe(
				recurringSetup.instanceId,
			);
			expect(dbException[0]?.createdBy).toBe(creatorId);
			expect(dbException[0]?.updatedBy).toBe(creatorId);

			// Verify original volunteer group still exists (not actually deleted)
			const dbGroup = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupsTable)
				.where(eq(eventVolunteerGroupsTable.id, group.groupId))
				.limit(1);

			expect(dbGroup).toHaveLength(1);
		});

		test("Integration: Successfully updates existing volunteer group exception (onConflictDoUpdate)", async () => {
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

			const recurringSetup = await createRecurringEventSetup(
				organization.orgId,
				creatorId,
			);
			testCleanupFunctions.push(recurringSetup.cleanup);

			const group = await createTestEventVolunteerGroup(
				recurringSetup.templateId,
				testUser.userId, // Leader
				creatorId, // Creator
			);
			testCleanupFunctions.push(group.cleanup);

			// Pre-create an exception record
			const [existingException] = await server.drizzleClient
				.insert(eventVolunteerGroupExceptionsTable)
				.values({
					volunteerGroupId: group.groupId,
					recurringEventInstanceId: recurringSetup.instanceId,
					createdBy: creatorId,
					updatedBy: creatorId,
				})
				.returning();

			assertToBeNonNullish(existingException);

			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroupForInstance,
				{
					headers: {
						authorization: `bearer ${adminAuth}`,
					},
					variables: {
						input: {
							volunteerGroupId: group.groupId,
							recurringEventInstanceId: recurringSetup.instanceId,
						},
					},
				},
			);

			expect(deleteResult.errors).toBeUndefined();
			expect(deleteResult.data).toBeDefined();
			assertToBeNonNullish(deleteResult.data);
			assertToBeNonNullish(
				deleteResult.data.deleteEventVolunteerGroupForInstance,
			);

			// Verify that existing exception was updated (not a new record created)
			const dbExceptions = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupExceptionsTable)
				.where(
					eq(
						eventVolunteerGroupExceptionsTable.volunteerGroupId,
						group.groupId,
					),
				);

			expect(dbExceptions).toHaveLength(1); // Still only one record
			expect(dbExceptions[0]?.id).toBe(existingException.id); // Same ID
			expect(dbExceptions[0]?.updatedBy).toBe(creatorId);
			expect(dbExceptions[0]?.updatedAt).not.toEqual(
				existingException.updatedAt,
			); // Updated timestamp
		});

		test("Integration: Multiple validation issues trigger comprehensive error mapping", async () => {
			const { token: adminAuth } = await ensureAdminAuth();

			// Test with empty strings to trigger multiple validation issues
			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroupForInstance,
				{
					headers: {
						authorization: `bearer ${adminAuth}`,
					},
					variables: {
						input: {
							volunteerGroupId: "", // Empty string should trigger validation
							recurringEventInstanceId: "", // Empty string should trigger validation
						},
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
						path: ["deleteEventVolunteerGroupForInstance"],
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

		test("Integration: Regular user can create volunteer group exception", async () => {
			// This mutation doesn't seem to have explicit authorization checks beyond authentication
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

			const recurringSetup = await createRecurringEventSetup(
				organization.orgId,
				creatorId,
			);
			testCleanupFunctions.push(recurringSetup.cleanup);

			const group = await createTestEventVolunteerGroup(
				recurringSetup.templateId,
				testUser.userId, // Leader
				creatorId, // Creator
			);
			testCleanupFunctions.push(group.cleanup);

			// Use regular user's token instead of admin
			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroupForInstance,
				{
					headers: {
						authorization: `bearer ${testUser.authToken}`,
					},
					variables: {
						input: {
							volunteerGroupId: group.groupId,
							recurringEventInstanceId: recurringSetup.instanceId,
						},
					},
				},
			);

			expect(deleteResult.errors).toBeUndefined();
			expect(deleteResult.data).toBeDefined();
			assertToBeNonNullish(deleteResult.data);
			assertToBeNonNullish(
				deleteResult.data.deleteEventVolunteerGroupForInstance,
			);

			// Verify exception was created with regular user as creator
			const dbException = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupExceptionsTable)
				.where(
					eq(
						eventVolunteerGroupExceptionsTable.volunteerGroupId,
						group.groupId,
					),
				)
				.limit(1);

			expect(dbException).toHaveLength(1);
			expect(dbException[0]?.createdBy).toBe(testUser.userId);
			expect(dbException[0]?.updatedBy).toBe(testUser.userId);
		});

		test("Integration: Volunteer group with custom properties returns correctly", async () => {
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

			const recurringSetup = await createRecurringEventSetup(
				organization.orgId,
				creatorId,
			);
			testCleanupFunctions.push(recurringSetup.cleanup);

			const group = await createTestEventVolunteerGroup(
				recurringSetup.templateId,
				testUser.userId, // Leader
				creatorId, // Creator
				"Special Operations Team",
				"Team handling special operations for the event",
				8,
			);
			testCleanupFunctions.push(group.cleanup);

			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroupForInstance,
				{
					headers: {
						authorization: `bearer ${adminAuth}`,
					},
					variables: {
						input: {
							volunteerGroupId: group.groupId,
							recurringEventInstanceId: recurringSetup.instanceId,
						},
					},
				},
			);

			expect(deleteResult.errors).toBeUndefined();
			expect(deleteResult.data).toBeDefined();
			assertToBeNonNullish(deleteResult.data);
			assertToBeNonNullish(
				deleteResult.data.deleteEventVolunteerGroupForInstance,
			);

			const returnedGroup =
				deleteResult.data.deleteEventVolunteerGroupForInstance;
			expect(returnedGroup.id).toBe(group.groupId);
			expect(returnedGroup.name).toBe("Special Operations Team");
			expect(returnedGroup.description).toBe(
				"Team handling special operations for the event",
			);
			expect(returnedGroup.volunteersRequired).toBe(8);
			expect(returnedGroup.leader?.id).toBe(testUser.userId);
			expect(returnedGroup.event?.id).toBe(recurringSetup.templateId);
			expect(returnedGroup.creator?.id).toBe(creatorId);
			expect(returnedGroup.createdAt).toBeDefined();
			expect(returnedGroup.updatedAt).toBeDefined();
		});

		test("Integration: Database operation verification - exception creation", async () => {
			// This test covers the check: if (!createdVolunteerGroupException) { throw unexpected }
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

			const recurringSetup = await createRecurringEventSetup(
				organization.orgId,
				creatorId,
			);
			testCleanupFunctions.push(recurringSetup.cleanup);

			const group = await createTestEventVolunteerGroup(
				recurringSetup.templateId,
				testUser.userId,
				creatorId,
			);
			testCleanupFunctions.push(group.cleanup);

			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroupForInstance,
				{
					headers: {
						authorization: `bearer ${adminAuth}`,
					},
					variables: {
						input: {
							volunteerGroupId: group.groupId,
							recurringEventInstanceId: recurringSetup.instanceId,
						},
					},
				},
			);

			expect(deleteResult.errors).toBeUndefined();
			expect(deleteResult.data).toBeDefined();
			assertToBeNonNullish(deleteResult.data);
			assertToBeNonNullish(
				deleteResult.data.deleteEventVolunteerGroupForInstance,
			);

			// This verifies that createdVolunteerGroupException is NOT undefined (covering the defensive check)
			const returnedGroup =
				deleteResult.data.deleteEventVolunteerGroupForInstance;
			expect(returnedGroup).toBeDefined();
			expect(returnedGroup.id).toBe(group.groupId);

			// Verify the exception was successfully created
			const dbException = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupExceptionsTable)
				.where(
					eq(
						eventVolunteerGroupExceptionsTable.volunteerGroupId,
						group.groupId,
					),
				)
				.limit(1);

			expect(dbException).toHaveLength(1);
			expect(dbException[0]?.createdBy).toBe(creatorId);
		});

		test("Integration: Covers all mutation logic paths", async () => {
			// This test ensures we cover all the successful execution paths
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

			const recurringSetup = await createRecurringEventSetup(
				organization.orgId,
				creatorId,
			);
			testCleanupFunctions.push(recurringSetup.cleanup);

			const group = await createTestEventVolunteerGroup(
				recurringSetup.templateId,
				testUser.userId,
				creatorId,
				"Comprehensive Test Group",
				"Group for testing all logic paths",
				7,
			);
			testCleanupFunctions.push(group.cleanup);

			const deleteResult = await mercuriusClient.mutate(
				Mutation_deleteEventVolunteerGroupForInstance,
				{
					headers: {
						authorization: `bearer ${adminAuth}`,
					},
					variables: {
						input: {
							volunteerGroupId: group.groupId,
							recurringEventInstanceId: recurringSetup.instanceId,
						},
					},
				},
			);

			expect(deleteResult.errors).toBeUndefined();
			expect(deleteResult.data).toBeDefined();
			assertToBeNonNullish(deleteResult.data);
			assertToBeNonNullish(
				deleteResult.data.deleteEventVolunteerGroupForInstance,
			);

			// Verify all mutation logic paths are covered:
			// 1. Authentication check ✓
			// 2. Input validation ✓ (covered in other tests)
			// 3. Volunteer group existence check ✓
			// 4. Event instance existence check ✓
			// 5. Database insert/update operation ✓
			// 6. Return existing volunteer group ✓

			const returnedGroup =
				deleteResult.data.deleteEventVolunteerGroupForInstance;
			expect(returnedGroup.id).toBe(group.groupId);
			expect(returnedGroup.name).toBe("Comprehensive Test Group");
			expect(returnedGroup.description).toBe(
				"Group for testing all logic paths",
			);
			expect(returnedGroup.volunteersRequired).toBe(7);
			expect(returnedGroup.leader?.id).toBe(testUser.userId);
			expect(returnedGroup.event?.id).toBe(recurringSetup.templateId);
			expect(returnedGroup.creator?.id).toBe(creatorId);

			// Verify the exception was created correctly
			const dbException = await server.drizzleClient
				.select()
				.from(eventVolunteerGroupExceptionsTable)
				.where(
					eq(
						eventVolunteerGroupExceptionsTable.volunteerGroupId,
						group.groupId,
					),
				)
				.limit(1);

			expect(dbException).toHaveLength(1);
			expect(dbException[0]?.volunteerGroupId).toBe(group.groupId);
			expect(dbException[0]?.recurringEventInstanceId).toBe(
				recurringSetup.instanceId,
			);
			expect(dbException[0]?.createdBy).toBe(creatorId);
			expect(dbException[0]?.updatedBy).toBe(creatorId);
			expect(dbException[0]?.createdAt).toBeDefined();
			expect(dbException[0]?.updatedAt).toBeDefined();
		});
	},
);
