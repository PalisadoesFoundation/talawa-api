import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { expect, suite, test } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createUser,
	Mutation_deleteSingleEventInstance,
	Query_currentUser,
} from "../documentNodes";

async function addMembership(
	organizationId: string,
	memberId: string,
	role: "administrator" | "regular",
) {
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
			name: "Daily Standup",
			description: "Daily team standup meeting",
			organizationId,
			creatorId,
			isRecurringEventTemplate: true,
			startAt: new Date("2024-01-01T09:00:00Z"),
			endAt: new Date("2024-01-01T09:30:00Z"),
			allDay: false,
			location: "Meeting Room A",
			isPublic: true,
			isRegisterable: false,
		})
		.returning();

	assertToBeNonNullish(template);

	// Create recurrence rule
	const [recurrenceRule] = await server.drizzleClient
		.insert(recurrenceRulesTable)
		.values({
			baseRecurringEventId: template.id,
			originalSeriesId,
			recurrenceStartDate: new Date("2024-01-01"),
			recurrenceEndDate: new Date("2024-01-31"),
			frequency: "DAILY",
			interval: 1,
			organizationId,
			creatorId,
			recurrenceRuleString: "RRULE:FREQ=DAILY;INTERVAL=1",
			latestInstanceDate: new Date("2024-01-15"),
		})
		.returning();

	assertToBeNonNullish(recurrenceRule);

	// Create multiple instances
	const instancesData = [
		{
			baseRecurringEventId: template.id,
			recurrenceRuleId: recurrenceRule.id,
			originalSeriesId,
			organizationId,
			originalInstanceStartTime: new Date("2024-01-01T09:00:00Z"),
			actualStartTime: new Date("2024-01-01T09:00:00Z"),
			actualEndTime: new Date("2024-01-01T09:30:00Z"),
			sequenceNumber: 1,
		},
		{
			baseRecurringEventId: template.id,
			recurrenceRuleId: recurrenceRule.id,
			originalSeriesId,
			organizationId,
			originalInstanceStartTime: new Date("2024-01-02T09:00:00Z"),
			actualStartTime: new Date("2024-01-02T09:00:00Z"),
			actualEndTime: new Date("2024-01-02T09:30:00Z"),
			sequenceNumber: 2,
		},
		{
			baseRecurringEventId: template.id,
			recurrenceRuleId: recurrenceRule.id,
			originalSeriesId,
			organizationId,
			originalInstanceStartTime: new Date("2024-01-03T09:00:00Z"),
			actualStartTime: new Date("2024-01-03T09:00:00Z"),
			actualEndTime: new Date("2024-01-03T09:30:00Z"),
			sequenceNumber: 3,
		},
	];

	const instances = await server.drizzleClient
		.insert(recurringEventInstancesTable)
		.values(instancesData)
		.returning();

	return {
		templateId: template.id,
		instanceIds: instances.map((i) => i.id),
	};
}

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);

suite("Mutation field deleteSingleEventInstance", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteSingleEventInstance,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.deleteSingleEventInstance).toBeNull();
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
				Mutation_deleteSingleEventInstance,
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
			expect(result.data?.deleteSingleEventInstance ?? null).toBeNull();
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
				Mutation_deleteSingleEventInstance,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.deleteSingleEventInstance).toBeNull();
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

			// Delete the user from the database directly (bypassing GraphQL)
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, tempUserId));

			// Try to use the deleted user's token
			const result = await mercuriusClient.mutate(
				Mutation_deleteSingleEventInstance,
				{
					headers: { authorization: `bearer ${tempUserToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.deleteSingleEventInstance).toBeNull();
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
			const regularUserId = regularUserResult.data.createUser.user?.id;
			assertToBeNonNullish(regularUserId);

			// Create organization and event with admin user
			const organizationId = await createOrganizationAndGetId(authToken);
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);

			const { instanceIds } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			// Add regular user to organization with regular role
			await addMembership(organizationId, regularUserId, "regular");

			assertToBeNonNullish(instanceIds[1]);

			const result = await mercuriusClient.mutate(
				Mutation_deleteSingleEventInstance,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							id: instanceIds[1], // Second instance
						},
					},
				},
			);

			expect(result.data?.deleteSingleEventInstance).toBeNull();
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
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);

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
				Mutation_deleteSingleEventInstance,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: instanceIds[1],
						},
					},
				},
			);

			expect(result.data?.deleteSingleEventInstance).toBeNull();
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

		test("should successfully cancel a single instance when user is administrator", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);

			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId);

			assertToBeNonNullish(instanceIds[1]);

			const result = await mercuriusClient.mutate(
				Mutation_deleteSingleEventInstance,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: instanceIds[1], // Cancel second instance
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteSingleEventInstance).toMatchObject({
				id: instanceIds[1],
				name: "Daily Standup",
				description: "Daily team standup meeting",
			});

			// Verify that all instances still exist but the target is cancelled
			const allInstances =
				await server.drizzleClient.query.recurringEventInstancesTable.findMany({
					where: (fields, operators) =>
						operators.eq(fields.baseRecurringEventId, templateId),
				});

			expect(allInstances).toHaveLength(3);

			const cancelledInstance = allInstances.find(
				(i) => i.id === instanceIds[1],
			);
			expect(cancelledInstance?.isCancelled).toBe(true);

			const otherInstances = allInstances.filter(
				(i) => i.id !== instanceIds[1],
			);
			for (const instance of otherInstances) {
				expect(instance.isCancelled).toBe(false);
			}
		});

		test("should successfully cancel a single instance when user is organization administrator", async () => {
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
			const orgAdminId = orgAdminResult.data.createUser.user?.id;
			assertToBeNonNullish(orgAdminId);

			const organizationId = await createOrganizationAndGetId(authToken);
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);

			const { instanceIds } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			assertToBeNonNullish(instanceIds[0]);

			// Add org admin to organization
			await addMembership(organizationId, orgAdminId, "administrator");

			const result = await mercuriusClient.mutate(
				Mutation_deleteSingleEventInstance,
				{
					headers: { authorization: `bearer ${orgAdminToken}` },
					variables: {
						input: {
							id: instanceIds[0], // Cancel first instance
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteSingleEventInstance).toMatchObject({
				id: instanceIds[0],
				name: "Daily Standup",
				description: "Daily team standup meeting",
			});

			// Verify that the instance is cancelled
			assertToBeNonNullish(instanceIds[0]);
			const firstInstanceId = instanceIds[0];
			const instance =
				await server.drizzleClient.query.recurringEventInstancesTable.findFirst(
					{
						where: (fields, operators) =>
							operators.eq(fields.id, firstInstanceId),
					},
				);

			expect(instance?.isCancelled).toBe(true);
		});

		test("should return proper GraphQL fields for cancelled instance", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);

			const { instanceIds } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			assertToBeNonNullish(instanceIds[2]);

			const result = await mercuriusClient.mutate(
				Mutation_deleteSingleEventInstance,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: instanceIds[2], // Cancel third instance
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteSingleEventInstance).toMatchObject({
				id: instanceIds[2],
				name: "Daily Standup",
				description: "Daily team standup meeting",
				location: "Meeting Room A",
				allDay: false,
				isPublic: true,
				isRegisterable: false,
				hasExceptions: false,
				sequenceNumber: 3,
				organization: {
					id: organizationId,
				},
			});
		});
	});
});
