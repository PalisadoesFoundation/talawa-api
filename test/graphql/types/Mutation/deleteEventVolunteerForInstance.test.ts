import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerExceptionsTable } from "~/src/drizzle/tables/eventVolunteerExceptions";
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
	Mutation_deleteEventVolunteerForInstance,
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

	// Add delay to prevent rate limiting
	await new Promise((resolve) => setTimeout(resolve, 1000));

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

	// Add delay to prevent rate limiting
	await new Promise((resolve) => setTimeout(resolve, 1000));

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
			// Volunteer will be cleaned up with organization
		},
	};
}

beforeAll(async () => {
	await ensureAdminAuth();
});

suite("Mutation deleteEventVolunteerForInstance - Integration Tests", () => {
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

	test("Integration: Unauthenticated user cannot delete volunteer for instance", async () => {
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerForInstance,
			{
				variables: {
					input: {
						volunteerId: faker.string.uuid(),
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
					path: ["deleteEventVolunteerForInstance"],
				}),
			]),
		);
	});

	test("Integration: Input validation error with invalid UUID formats", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerForInstance,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						volunteerId: "invalid-uuid-format",
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
					path: ["deleteEventVolunteerForInstance"],
				}),
			]),
		);
	});

	test("Integration: Volunteer not found error", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const { token: adminAuth, userId: creatorId } = await ensureAdminAuth();

		const recurringSetup = await createRecurringEventSetup(
			organization.orgId,
			creatorId,
		);
		testCleanupFunctions.push(recurringSetup.cleanup);

		const nonExistentVolunteerId = faker.string.uuid();

		// Add delay to prevent rate limiting
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerForInstance,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						volunteerId: nonExistentVolunteerId,
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
								argumentPath: ["input", "volunteerId"],
							}),
						]),
					}),
					message: "The specified volunteer does not exist.",
					path: ["deleteEventVolunteerForInstance"],
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			event.eventId,
			creatorId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		const nonExistentInstanceId = faker.string.uuid();

		// Add delay to prevent rate limiting
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerForInstance,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						volunteerId: volunteer.volunteerId,
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
					path: ["deleteEventVolunteerForInstance"],
				}),
			]),
		);
	});

	test("Integration: Successfully creates new volunteer exception (deletion)", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			recurringSetup.templateId,
			creatorId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Add delay to prevent rate limiting
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerForInstance,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						volunteerId: volunteer.volunteerId,
						recurringEventInstanceId: recurringSetup.instanceId,
					},
				},
			},
		);

		expect(deleteResult.errors).toBeUndefined();
		expect(deleteResult.data).toBeDefined();
		assertToBeNonNullish(deleteResult.data);
		assertToBeNonNullish(deleteResult.data.deleteEventVolunteerForInstance);

		const returnedVolunteer = deleteResult.data.deleteEventVolunteerForInstance;
		expect(returnedVolunteer.id).toBe(volunteer.volunteerId);
		expect(returnedVolunteer.user?.id).toBe(testUser.userId);
		expect(returnedVolunteer.event?.id).toBe(recurringSetup.templateId);

		// Verify that volunteer exception was created
		const dbException = await server.drizzleClient
			.select()
			.from(eventVolunteerExceptionsTable)
			.where(
				eq(eventVolunteerExceptionsTable.volunteerId, volunteer.volunteerId),
			)
			.limit(1);

		expect(dbException).toHaveLength(1);
		expect(dbException[0]?.volunteerId).toBe(volunteer.volunteerId);
		expect(dbException[0]?.recurringEventInstanceId).toBe(
			recurringSetup.instanceId,
		);
		expect(dbException[0]?.createdBy).toBe(creatorId);
		expect(dbException[0]?.updatedBy).toBe(creatorId);

		// Verify original volunteer still exists (not actually deleted)
		const dbVolunteer = await server.drizzleClient
			.select()
			.from(eventVolunteersTable)
			.where(eq(eventVolunteersTable.id, volunteer.volunteerId))
			.limit(1);

		expect(dbVolunteer).toHaveLength(1);
	});

	test("Integration: Successfully updates existing volunteer exception (onConflictDoUpdate)", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			recurringSetup.templateId,
			creatorId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Pre-create an exception record
		const [existingException] = await server.drizzleClient
			.insert(eventVolunteerExceptionsTable)
			.values({
				volunteerId: volunteer.volunteerId,
				recurringEventInstanceId: recurringSetup.instanceId,
				createdBy: creatorId,
				updatedBy: creatorId,
			})
			.returning();

		assertToBeNonNullish(existingException);

		// Add delay to prevent rate limiting
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerForInstance,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						volunteerId: volunteer.volunteerId,
						recurringEventInstanceId: recurringSetup.instanceId,
					},
				},
			},
		);

		expect(deleteResult.errors).toBeUndefined();
		expect(deleteResult.data).toBeDefined();
		assertToBeNonNullish(deleteResult.data);
		assertToBeNonNullish(deleteResult.data.deleteEventVolunteerForInstance);

		// Verify that existing exception was updated (not a new record created)
		const dbExceptions = await server.drizzleClient
			.select()
			.from(eventVolunteerExceptionsTable)
			.where(
				eq(eventVolunteerExceptionsTable.volunteerId, volunteer.volunteerId),
			);

		expect(dbExceptions).toHaveLength(1); // Still only one record
		expect(dbExceptions[0]?.id).toBe(existingException.id); // Same ID
		expect(dbExceptions[0]?.updatedBy).toBe(creatorId);
		expect(dbExceptions[0]?.updatedAt).not.toEqual(existingException.updatedAt); // Updated timestamp
	});

	test("Integration: Multiple validation issues trigger comprehensive error mapping", async () => {
		const { token: adminAuth } = await ensureAdminAuth();

		// Test with empty strings to trigger multiple validation issues
		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerForInstance,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						volunteerId: "", // Empty string should trigger validation
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
					path: ["deleteEventVolunteerForInstance"],
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

	test("Integration: Regular user can create volunteer exception", async () => {
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			recurringSetup.templateId,
			creatorId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Use regular user's token instead of admin
		// Add delay to prevent rate limiting
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerForInstance,
			{
				headers: {
					authorization: `bearer ${testUser.authToken}`,
				},
				variables: {
					input: {
						volunteerId: volunteer.volunteerId,
						recurringEventInstanceId: recurringSetup.instanceId,
					},
				},
			},
		);

		expect(deleteResult.errors).toBeUndefined();
		expect(deleteResult.data).toBeDefined();
		assertToBeNonNullish(deleteResult.data);
		assertToBeNonNullish(deleteResult.data.deleteEventVolunteerForInstance);

		// Verify exception was created with regular user as creator
		const dbException = await server.drizzleClient
			.select()
			.from(eventVolunteerExceptionsTable)
			.where(
				eq(eventVolunteerExceptionsTable.volunteerId, volunteer.volunteerId),
			)
			.limit(1);

		expect(dbException).toHaveLength(1);
		expect(dbException[0]?.createdBy).toBe(testUser.userId);
		expect(dbException[0]?.updatedBy).toBe(testUser.userId);
	});

	test("Integration: Volunteer with custom properties returns correctly", async () => {
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

		// Create volunteer with custom properties
		const [volunteer] = await server.drizzleClient
			.insert(eventVolunteersTable)
			.values({
				userId: testUser.userId,
				eventId: recurringSetup.templateId,
				creatorId,
				hasAccepted: true, // Different from default
				isPublic: false, // Different from default
				hoursVolunteered: "25.75", // Different from default
			})
			.returning();

		assertToBeNonNullish(volunteer);

		// Add delay to prevent rate limiting
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerForInstance,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						volunteerId: volunteer.id,
						recurringEventInstanceId: recurringSetup.instanceId,
					},
				},
			},
		);

		expect(deleteResult.errors).toBeUndefined();
		expect(deleteResult.data).toBeDefined();
		assertToBeNonNullish(deleteResult.data);
		assertToBeNonNullish(deleteResult.data.deleteEventVolunteerForInstance);

		const returnedVolunteer = deleteResult.data.deleteEventVolunteerForInstance;
		expect(returnedVolunteer.id).toBe(volunteer.id);
		expect(returnedVolunteer.hasAccepted).toBe(true);
		expect(returnedVolunteer.isPublic).toBe(false);
		expect(returnedVolunteer.hoursVolunteered).toBe(25.75);
		expect(returnedVolunteer.user?.id).toBe(testUser.userId);
		expect(returnedVolunteer.event?.id).toBe(recurringSetup.templateId);
		expect(returnedVolunteer.createdAt).toBeDefined();
	});

	test("Integration: Database operation verification - exception creation", async () => {
		// This test covers the check: if (!createdVolunteerException) { throw unexpected }
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

		const volunteer = await createTestEventVolunteer(
			testUser.userId,
			recurringSetup.templateId,
			creatorId,
		);
		testCleanupFunctions.push(volunteer.cleanup);

		// Add delay to prevent rate limiting
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const deleteResult = await mercuriusClient.mutate(
			Mutation_deleteEventVolunteerForInstance,
			{
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						volunteerId: volunteer.volunteerId,
						recurringEventInstanceId: recurringSetup.instanceId,
					},
				},
			},
		);

		expect(deleteResult.errors).toBeUndefined();
		expect(deleteResult.data).toBeDefined();
		assertToBeNonNullish(deleteResult.data);
		assertToBeNonNullish(deleteResult.data.deleteEventVolunteerForInstance);

		// This verifies that createdVolunteerException is NOT undefined (covering the defensive check)
		const returnedVolunteer = deleteResult.data.deleteEventVolunteerForInstance;
		expect(returnedVolunteer).toBeDefined();
		expect(returnedVolunteer.id).toBe(volunteer.volunteerId);

		// Verify the exception was successfully created
		const dbException = await server.drizzleClient
			.select()
			.from(eventVolunteerExceptionsTable)
			.where(
				eq(eventVolunteerExceptionsTable.volunteerId, volunteer.volunteerId),
			)
			.limit(1);

		expect(dbException).toHaveLength(1);
		expect(dbException[0]?.createdBy).toBe(creatorId);
	});
});
