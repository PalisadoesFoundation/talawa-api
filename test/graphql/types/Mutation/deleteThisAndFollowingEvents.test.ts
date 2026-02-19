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
	Mutation_deleteThisAndFollowingEvents,
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

	return {
		templateId: template.id,
		instanceIds: instances.map((i) => i.id),
	};
}

const { accessToken: authToken } = await getAdminAuthViaRest(server);
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

			// Create organization and event with admin user
			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
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

			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);

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
	});
});
