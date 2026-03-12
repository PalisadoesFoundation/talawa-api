import { faker } from "@faker-js/faker";
import { and, eq, inArray } from "drizzle-orm";
import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createUser,
	Mutation_deleteThisAndFollowingEvents,
	Query_signIn,
} from "../documentNodes";

const createdState = {
	organizationIds: new Set<string>(),
	userIds: new Set<string>(),
	eventIds: new Set<string>(),
	recurrenceRuleIds: new Set<string>(),
	recurringInstanceIds: new Set<string>(),
	organizationMembershipKeys: new Set<string>(),
};

async function addMembership(
	organizationId: string,
	memberId: string,
	role: "administrator" | "regular",
) {
	createdState.organizationMembershipKeys.add(`${organizationId}:${memberId}`);

	await server.drizzleClient
		.insert(organizationMembershipsTable)
		.values({
			organizationId,
			memberId,
			role,
		})
		.execute();
}

// Helper to create an organization with a unique name and return its id.
async function createOrganizationAndGetId(authToken: string): Promise<string> {
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
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	createdState.organizationIds.add(orgId);
	return orgId;
}

// Helper to create a recurring event template and instances
async function createRecurringEventWithInstances(
	organizationId: string,
	creatorId: string,
): Promise<{ templateId: string; instanceIds: string[] }> {
	const originalSeriesId = faker.string.uuid();
	// Create recurring event template
	const [template] = await server.drizzleClient
		.insert(eventsTable)
		.values({
			name: "Weekly Meeting",
			description: "Weekly team meeting",
			organizationId,
			creatorId,
			isRecurringEventTemplate: true,
			startAt: new Date("2024-01-01T10:00:00Z"),
			endAt: new Date("2024-01-01T11:00:00Z"),
			allDay: false,
			location: "Conference Room",
			isPublic: true,
			isRegisterable: false,
		})
		.returning();

	assertToBeNonNullish(template);
	createdState.eventIds.add(template.id);

	// Create recurrence rule
	const [recurrenceRule] = await server.drizzleClient
		.insert(recurrenceRulesTable)
		.values({
			baseRecurringEventId: template.id,
			originalSeriesId,
			recurrenceStartDate: new Date("2024-01-01"),
			recurrenceEndDate: new Date("2024-12-31"),
			frequency: "WEEKLY",
			interval: 1,
			organizationId,
			creatorId,
			recurrenceRuleString: "RRULE:FREQ=WEEKLY;INTERVAL=1",
			latestInstanceDate: new Date("2024-01-15"),
		})
		.returning();

	assertToBeNonNullish(recurrenceRule);
	createdState.recurrenceRuleIds.add(recurrenceRule.id);

	// Create multiple instances
	const instancesData = [
		{
			baseRecurringEventId: template.id,
			recurrenceRuleId: recurrenceRule.id,
			originalSeriesId,
			organizationId,
			originalInstanceStartTime: new Date("2024-01-01T10:00:00Z"),
			actualStartTime: new Date("2024-01-01T10:00:00Z"),
			actualEndTime: new Date("2024-01-01T11:00:00Z"),
			sequenceNumber: 1,
		},
		{
			baseRecurringEventId: template.id,
			recurrenceRuleId: recurrenceRule.id,
			originalSeriesId,
			organizationId,
			originalInstanceStartTime: new Date("2024-01-08T10:00:00Z"),
			actualStartTime: new Date("2024-01-08T10:00:00Z"),
			actualEndTime: new Date("2024-01-08T11:00:00Z"),
			sequenceNumber: 2,
		},
		{
			baseRecurringEventId: template.id,
			recurrenceRuleId: recurrenceRule.id,
			originalSeriesId,
			organizationId,
			originalInstanceStartTime: new Date("2024-01-15T10:00:00Z"),
			actualStartTime: new Date("2024-01-15T10:00:00Z"),
			actualEndTime: new Date("2024-01-15T11:00:00Z"),
			sequenceNumber: 3,
		},
	];

	const instances = await server.drizzleClient
		.insert(recurringEventInstancesTable)
		.values(instancesData)
		.returning();

	for (const instance of instances) {
		createdState.recurringInstanceIds.add(instance.id);
	}

	return {
		templateId: template.id,
		instanceIds: instances.map((i) => i.id),
	};
}

beforeEach(() => {
	createdState.organizationIds.clear();
	createdState.userIds.clear();
	createdState.eventIds.clear();
	createdState.recurrenceRuleIds.clear();
	createdState.recurringInstanceIds.clear();
	createdState.organizationMembershipKeys.clear();
});

// Clean up after each test to prevent state leakage
afterEach(async () => {
	const recurringInstanceIds = [...createdState.recurringInstanceIds];
	const recurrenceRuleIds = [...createdState.recurrenceRuleIds];
	const eventIds = [...createdState.eventIds];
	const organizationIds = [...createdState.organizationIds];
	const userIds = [...createdState.userIds];
	const organizationMembershipKeys = [
		...createdState.organizationMembershipKeys,
	];

	// 1) recurring instances
	if (recurringInstanceIds.length > 0) {
		await server.drizzleClient
			.delete(recurringEventInstancesTable)
			.where(inArray(recurringEventInstancesTable.id, recurringInstanceIds))
			.execute();
	}

	// 2) recurrence rules
	if (recurrenceRuleIds.length > 0) {
		await server.drizzleClient
			.delete(recurrenceRulesTable)
			.where(inArray(recurrenceRulesTable.id, recurrenceRuleIds))
			.execute();
	}

	// 3) events
	if (eventIds.length > 0) {
		await server.drizzleClient
			.delete(eventsTable)
			.where(inArray(eventsTable.id, eventIds))
			.execute();
	}

	// fallback by organization in case a test inserted rows directly without tracking
	if (organizationIds.length > 0) {
		await server.drizzleClient
			.delete(recurringEventInstancesTable)
			.where(
				inArray(recurringEventInstancesTable.organizationId, organizationIds),
			)
			.execute();
		await server.drizzleClient
			.delete(recurrenceRulesTable)
			.where(inArray(recurrenceRulesTable.organizationId, organizationIds))
			.execute();

		await server.drizzleClient
			.delete(eventsTable)
			.where(inArray(eventsTable.organizationId, organizationIds))
			.execute();

		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(
				inArray(organizationMembershipsTable.organizationId, organizationIds),
			)
			.execute();

		await server.drizzleClient
			.delete(organizationsTable)
			.where(inArray(organizationsTable.id, organizationIds))
			.execute();
	}

	// 4) memberships
	if (organizationMembershipKeys.length > 0) {
		for (const key of organizationMembershipKeys) {
			const [organizationId, memberId] = key.split(":");
			if (!organizationId || !memberId) {
				continue;
			}
			await server.drizzleClient
				.delete(organizationMembershipsTable)
				.where(
					and(
						eq(organizationMembershipsTable.organizationId, organizationId),
						eq(organizationMembershipsTable.memberId, memberId),
					),
				)
				.execute();
		}
	}

	// 5) organizations handled above

	// 6) users
	if (userIds.length > 0) {
		await server.drizzleClient
			.delete(organizationMembershipsTable)
			.where(inArray(organizationMembershipsTable.memberId, userIds))
			.execute();

		await server.drizzleClient
			.delete(usersTable)
			.where(inArray(usersTable.id, userIds))
			.execute();
	}

	createdState.organizationIds.clear();
	createdState.userIds.clear();
	createdState.eventIds.clear();
	createdState.recurrenceRuleIds.clear();
	createdState.recurringInstanceIds.clear();
	createdState.organizationMembershipKeys.clear();
	vi.restoreAllMocks();
});

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

suite("Mutation field deleteThisAndFollowingEvents", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteThisAndFollowingEvents,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.deleteThisAndFollowingEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
					}),
				]),
			);
		});
	});

	suite("when the client is authenticated", () => {
		test("should return an error when input arguments are invalid", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							// Pass an invalid UUID format that will pass GraphQL validation but fail Zod validation
							id: "invalid-uuid-format",
						},
					},
				},
			);
			expect(result.data?.deleteThisAndFollowingEvents ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				]),
			);
		});

		test("should return an error when the recurring event instance is not found", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.deleteThisAndFollowingEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		});

		test("should return an error when authenticated user no longer exists in database", async () => {
			// Create a user to get a valid token
			const tempUserResult = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Temporary User",
						emailAddress: faker.internet.email(),
						password: "password123",
						countryCode: "us",
						role: "regular",
						isEmailAddressVerified: true,
					},
				},
			});
			assertToBeNonNullish(tempUserResult.data?.createUser);
			const tempUserToken = tempUserResult.data.createUser.authenticationToken;
			assertToBeNonNullish(tempUserToken);
			const tempUserId = tempUserResult.data.createUser.user?.id;
			assertToBeNonNullish(tempUserId);
			createdState.userIds.add(tempUserId);

			// Delete the user from the database directly (bypassing GraphQL)
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, tempUserId));

			// Try to use the deleted user's token
			const result = await mercuriusClient.mutate(
				Mutation_deleteThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${tempUserToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.deleteThisAndFollowingEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});

		test("should return an error when user is not authorized", async () => {
			// Create a regular user
			const regularUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Regular User",
							emailAddress: faker.internet.email(),
							password: "password123",
							countryCode: "us",
							role: "regular",
							isEmailAddressVerified: true,
						},
					},
				},
			);
			assertToBeNonNullish(regularUserResult.data?.createUser);
			const regularUserToken =
				regularUserResult.data.createUser.authenticationToken;
			assertToBeNonNullish(regularUserToken);
			const regularUserId = regularUserResult.data.createUser.user?.id;
			assertToBeNonNullish(regularUserId);
			createdState.userIds.add(regularUserId);

			// Create organization and event with admin user
			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn);
			assertToBeNonNullish(adminSignIn.data.signIn.user);
			const adminUserId = adminSignIn.data.signIn.user.id;

			const { instanceIds } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			assertToBeNonNullish(instanceIds[1]);

			// Add regular user to organization with regular role
			await addMembership(organizationId, regularUserId, "regular");

			const result = await mercuriusClient.mutate(
				Mutation_deleteThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							id: instanceIds[1], // Second instance
						},
					},
				},
			);

			expect(result.data?.deleteThisAndFollowingEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
					}),
				]),
			);
		});

		test("should return an error when instance is already cancelled", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn);
			assertToBeNonNullish(adminSignIn.data.signIn.user);
			const adminUserId = adminSignIn.data.signIn.user.id;

			const { instanceIds } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			assertToBeNonNullish(instanceIds[1]);

			// Cancel the instance first
			await server.drizzleClient
				.update(recurringEventInstancesTable)
				.set({ isCancelled: true })
				.where(eq(recurringEventInstancesTable.id, instanceIds[1]));

			const result = await mercuriusClient.mutate(
				Mutation_deleteThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: instanceIds[1],
						},
					},
				},
			);

			expect(result.data?.deleteThisAndFollowingEvents).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				]),
			);
		});

		test("should successfully delete this and following instances when user is administrator", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn);
			assertToBeNonNullish(adminSignIn.data.signIn.user);
			const adminUserId = adminSignIn.data.signIn.user.id;

			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId);

			assertToBeNonNullish(instanceIds[1]);

			const result = await mercuriusClient.mutate(
				Mutation_deleteThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: instanceIds[1], // Delete from second instance onwards
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteThisAndFollowingEvents).toMatchObject({
				id: instanceIds[1],
				name: "Weekly Meeting",
				description: "Weekly team meeting",
			});

			assertToBeNonNullish(result.data?.deleteThisAndFollowingEvents);

			// Verify that the first instance still exists (use the template ID)
			const remainingInstances =
				await server.drizzleClient.query.recurringEventInstancesTable.findMany({
					where: (fields, operators) =>
						operators.eq(fields.baseRecurringEventId, templateId),
				});

			expect(remainingInstances).toHaveLength(1);
			expect(remainingInstances[0]?.sequenceNumber).toBe(1);
		});

		test("should successfully delete this and following instances when user is organization administrator", async () => {
			// Create a regular user and make them org admin
			const orgAdminResult = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Org Admin",
						emailAddress: faker.internet.email(),
						password: "password123",
						countryCode: "us",
						role: "regular",
						isEmailAddressVerified: true,
					},
				},
			});
			assertToBeNonNullish(orgAdminResult.data?.createUser);
			const orgAdminToken = orgAdminResult.data.createUser.authenticationToken;
			assertToBeNonNullish(orgAdminToken);
			const orgAdminId = orgAdminResult.data.createUser.user?.id;
			assertToBeNonNullish(orgAdminId);
			createdState.userIds.add(orgAdminId);

			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn);
			assertToBeNonNullish(adminSignIn.data.signIn.user);
			const adminUserId = adminSignIn.data.signIn.user.id;

			const { templateId: orgAdminTemplateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId);

			assertToBeNonNullish(instanceIds[0]);

			// Add org admin to organization
			await addMembership(organizationId, orgAdminId, "administrator");

			const result = await mercuriusClient.mutate(
				Mutation_deleteThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${orgAdminToken}` },
					variables: {
						input: {
							id: instanceIds[0], // Delete all instances
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteThisAndFollowingEvents).toMatchObject({
				id: instanceIds[0],
				name: "Weekly Meeting",
				description: "Weekly team meeting",
			});

			assertToBeNonNullish(result.data?.deleteThisAndFollowingEvents);

			// Verify that all instances are deleted
			const remainingInstances =
				await server.drizzleClient.query.recurringEventInstancesTable.findMany({
					where: (fields, operators) =>
						operators.eq(fields.baseRecurringEventId, orgAdminTemplateId),
				});

			expect(remainingInstances).toHaveLength(0);
		});

		test("should return unexpected error when timed instance is missing actualStartTime", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);

			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn?.user);
			const adminUserId = adminSignIn.data.signIn.user.id;

			// Create a timed (allDay=false) template
			const [template] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "Timed Weekly Event",
					organizationId,
					creatorId: adminUserId,
					isRecurringEventTemplate: true,
					allDay: false,
					startAt: new Date("2024-01-01T10:00:00Z"),
					endAt: new Date("2024-01-01T11:00:00Z"),
					isPublic: true,
					isRegisterable: false,
				})
				.returning();
			assertToBeNonNullish(template);
			createdState.eventIds.add(template.id);

			const originalSeriesId = faker.string.uuid();
			const [recurrenceRule] = await server.drizzleClient
				.insert(recurrenceRulesTable)
				.values({
					baseRecurringEventId: template.id,
					originalSeriesId,
					recurrenceStartDate: new Date("2024-01-01"),
					recurrenceEndDate: new Date("2024-12-31"),
					frequency: "WEEKLY",
					interval: 1,
					organizationId,
					creatorId: adminUserId,
					recurrenceRuleString: "RRULE:FREQ=WEEKLY;INTERVAL=1",
					latestInstanceDate: new Date("2024-01-01"),
				})
				.returning();
			assertToBeNonNullish(recurrenceRule);
			createdState.recurrenceRuleIds.add(recurrenceRule.id);

			// Insert a timed instance with actualStartTime explicitly null
			const [instance] = await server.drizzleClient
				.insert(recurringEventInstancesTable)
				.values({
					baseRecurringEventId: template.id,
					recurrenceRuleId: recurrenceRule.id,
					originalSeriesId,
					organizationId,
					originalInstanceStartTime: new Date("2024-01-01T10:00:00Z"),
					actualStartTime: null,
					actualEndTime: null,
					sequenceNumber: 1,
				})
				.returning();
			assertToBeNonNullish(instance);
			createdState.recurringInstanceIds.add(instance.id);

			const result = await mercuriusClient.mutate(
				Mutation_deleteThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: instance.id } },
				},
			);

			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
		});

		test("should set recurrenceEndDate to midnight-minus-1ms of actualStartDate for all-day events", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);

			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn?.user);
			const adminUserId = adminSignIn.data.signIn.user.id;

			// Create an all-day template
			const [template] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "All-Day Weekly Event",
					organizationId,
					creatorId: adminUserId,
					isRecurringEventTemplate: true,
					allDay: true,
					startDate: "2024-03-01",
					endDate: "2024-03-02",
					isPublic: true,
					isRegisterable: false,
				})
				.returning();
			assertToBeNonNullish(template);
			createdState.eventIds.add(template.id);

			const originalSeriesId = faker.string.uuid();
			const [recurrenceRule] = await server.drizzleClient
				.insert(recurrenceRulesTable)
				.values({
					baseRecurringEventId: template.id,
					originalSeriesId,
					recurrenceStartDate: new Date("2024-03-01"),
					recurrenceEndDate: new Date("2024-12-31"),
					frequency: "WEEKLY",
					interval: 1,
					organizationId,
					creatorId: adminUserId,
					recurrenceRuleString: "RRULE:FREQ=WEEKLY;INTERVAL=1",
					latestInstanceDate: new Date("2024-03-15"),
				})
				.returning();
			assertToBeNonNullish(recurrenceRule);
			createdState.recurrenceRuleIds.add(recurrenceRule.id);

			// Insert three all-day instances
			const instances = await server.drizzleClient
				.insert(recurringEventInstancesTable)
				.values([
					{
						baseRecurringEventId: template.id,
						recurrenceRuleId: recurrenceRule.id,
						originalSeriesId,
						organizationId,
						originalInstanceStartDate: "2024-03-01",
						actualStartDate: "2024-03-01",
						actualEndDate: "2024-03-02",
						sequenceNumber: 1,
					},
					{
						baseRecurringEventId: template.id,
						recurrenceRuleId: recurrenceRule.id,
						originalSeriesId,
						organizationId,
						originalInstanceStartDate: "2024-03-08",
						actualStartDate: "2024-03-08",
						actualEndDate: "2024-03-09",
						sequenceNumber: 2,
					},
					{
						baseRecurringEventId: template.id,
						recurrenceRuleId: recurrenceRule.id,
						originalSeriesId,
						organizationId,
						originalInstanceStartDate: "2024-03-15",
						actualStartDate: "2024-03-15",
						actualEndDate: "2024-03-16",
						sequenceNumber: 3,
					},
				])
				.returning();
			for (const instance of instances) {
				createdState.recurringInstanceIds.add(instance.id);
			}
			expect(instances).toHaveLength(3);

			// Target the second instance (2024-03-08)
			const targetInstance = instances[1];
			assertToBeNonNullish(targetInstance);

			const result = await mercuriusClient.mutate(
				Mutation_deleteThisAndFollowingEvents,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: targetInstance.id } },
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteThisAndFollowingEvents).toBeDefined();

			// Verify recurrenceEndDate was set to midnight-minus-1ms of actualStartDate
			// i.e. new Date(new Date("2024-03-08T00:00:00.000Z").getTime() - 1)
			const updatedRule =
				await server.drizzleClient.query.recurrenceRulesTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, recurrenceRule.id),
				});
			assertToBeNonNullish(updatedRule);
			expect(updatedRule.recurrenceEndDate).toEqual(
				new Date(
					new Date(
						`${targetInstance.actualStartDate}T00:00:00.000Z`,
					).getTime() - 1,
				),
			);
		});
	});
});
