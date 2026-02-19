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
	Mutation_deleteEntireRecurringEventSeries,
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
			name: "Monthly Board Meeting",
			description: "Monthly board meeting for decision making",
			organizationId,
			creatorId,
			isRecurringEventTemplate: true,
			startAt: new Date("2024-01-15T14:00:00Z"),
			endAt: new Date("2024-01-15T16:00:00Z"),
			allDay: false,
			location: "Boardroom",
			isPublic: false,
			isRegisterable: true,
		})
		.returning();

	assertToBeNonNullish(template);

	// Create recurrence rule
	const [recurrenceRule] = await server.drizzleClient
		.insert(recurrenceRulesTable)
		.values({
			baseRecurringEventId: template.id,
			originalSeriesId,
			recurrenceStartDate: new Date("2024-01-15"),
			recurrenceEndDate: new Date("2024-12-15"),
			frequency: "MONTHLY",
			interval: 1,
			organizationId,
			creatorId,
			recurrenceRuleString: "RRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15",
			latestInstanceDate: new Date("2024-03-15"),
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
			originalInstanceStartTime: new Date("2024-01-15T14:00:00Z"),
			actualStartTime: new Date("2024-01-15T14:00:00Z"),
			actualEndTime: new Date("2024-01-15T16:00:00Z"),
			sequenceNumber: 1,
		},
		{
			baseRecurringEventId: template.id,
			recurrenceRuleId: recurrenceRule.id,
			originalSeriesId,
			organizationId,
			originalInstanceStartTime: new Date("2024-02-15T14:00:00Z"),
			actualStartTime: new Date("2024-02-15T14:00:00Z"),
			actualEndTime: new Date("2024-02-15T16:00:00Z"),
			sequenceNumber: 2,
		},
		{
			baseRecurringEventId: template.id,
			recurrenceRuleId: recurrenceRule.id,
			originalSeriesId,
			organizationId,
			originalInstanceStartTime: new Date("2024-03-15T14:00:00Z"),
			actualStartTime: new Date("2024-03-15T14:00:00Z"),
			actualEndTime: new Date("2024-03-15T16:00:00Z"),
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

suite("Mutation field deleteEntireRecurringEventSeries", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteEntireRecurringEventSeries,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.deleteEntireRecurringEventSeries).toBeNull();
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
				Mutation_deleteEntireRecurringEventSeries,
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
			expect(result.data?.deleteEntireRecurringEventSeries ?? null).toBeNull();
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

		test("should return an error when the recurring event template is not found", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);
			expect(result.data?.deleteEntireRecurringEventSeries).toBeNull();
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
				Mutation_deleteEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${tempUserToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.deleteEntireRecurringEventSeries).toBeNull();
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

			// Get admin user ID from environment
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);

			const { templateId } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			// Add regular user to organization with regular role
			await addMembership(organizationId, regularUserId, "regular");

			const result = await mercuriusClient.mutate(
				Mutation_deleteEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							id: templateId,
						},
					},
				},
			);

			expect(result.data?.deleteEntireRecurringEventSeries).toBeNull();
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

		test("should return an error when trying to delete a non-template event", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);

			// Create a standalone event (not a template)
			const [standaloneEvent] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "One-time Event",
					description: "A standalone event",
					organizationId,
					creatorId: adminUserId,
					isRecurringEventTemplate: false,
					startAt: new Date("2024-01-20T10:00:00Z"),
					endAt: new Date("2024-01-20T11:00:00Z"),
					allDay: false,
					location: "Meeting Room",
					isPublic: true,
					isRegisterable: false,
				})
				.returning();

			assertToBeNonNullish(standaloneEvent);

			const result = await mercuriusClient.mutate(
				Mutation_deleteEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: standaloneEvent.id,
						},
					},
				},
			);

			expect(result.data?.deleteEntireRecurringEventSeries).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						message:
							"No recurrence rule found for this recurring event template.",
					}),
				]),
			);
		});

		test("should return an error if the event is not a recurring event template", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);
			const { templateId } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			// Manually update the event to not be a recurring event template
			await server.drizzleClient
				.update(eventsTable)
				.set({ isRecurringEventTemplate: false })
				.where(eq(eventsTable.id, templateId));

			const result = await mercuriusClient.mutate(
				Mutation_deleteEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: templateId } },
				},
			);

			expect(result.data?.deleteEntireRecurringEventSeries).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
									message:
										"Event is not a recurring event template. Use deleteEvent for standalone events or other delete mutations for instances.",
								}),
							]),
						}),
					}),
				]),
			);
		});

		test("should return an error if the recurrence rule is missing an original series ID", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);
			const { templateId } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			// Manually update the recurrence rule to have a null originalSeriesId
			await server.drizzleClient
				.update(recurrenceRulesTable)
				.set({ originalSeriesId: null })
				.where(eq(recurrenceRulesTable.baseRecurringEventId, templateId));

			const result = await mercuriusClient.mutate(
				Mutation_deleteEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: templateId } },
				},
			);

			expect(result.data?.deleteEntireRecurringEventSeries).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
									message: "Recurrence rule missing original series ID.",
								}),
							]),
						}),
					}),
				]),
			);
		});

		test("should successfully delete entire recurring event series when user is administrator", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);

			const { templateId } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			const result = await mercuriusClient.mutate(
				Mutation_deleteEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: templateId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteEntireRecurringEventSeries).toMatchObject({
				id: templateId,
				name: "Monthly Board Meeting",
				description: "Monthly board meeting for decision making",
				location: "Boardroom",
				allDay: false,
				isPublic: false,
				isRegisterable: true,
				isRecurringEventTemplate: true,
			});

			// Verify that the template is deleted
			const deletedTemplate =
				await server.drizzleClient.query.eventsTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, templateId),
				});
			expect(deletedTemplate).toBeUndefined();

			// Verify that all instances are cascade deleted
			const remainingInstances =
				await server.drizzleClient.query.recurringEventInstancesTable.findMany({
					where: (fields, operators) =>
						operators.eq(fields.baseRecurringEventId, templateId),
				});
			expect(remainingInstances).toHaveLength(0);

			// Verify that recurrence rule is cascade deleted
			const remainingRule =
				await server.drizzleClient.query.recurrenceRulesTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.baseRecurringEventId, templateId),
				});
			expect(remainingRule).toBeUndefined();
		});

		test("should successfully delete entire recurring event series when user is organization administrator", async () => {
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

			// Get admin user ID
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);

			const { templateId } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			// Add org admin to organization
			await addMembership(organizationId, orgAdminId, "administrator");

			const result = await mercuriusClient.mutate(
				Mutation_deleteEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${orgAdminToken}` },
					variables: {
						input: {
							id: templateId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteEntireRecurringEventSeries).toMatchObject({
				id: templateId,
				name: "Monthly Board Meeting",
				description: "Monthly board meeting for decision making",
				isRecurringEventTemplate: true,
			});

			// Verify complete deletion
			const deletedTemplate =
				await server.drizzleClient.query.eventsTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, templateId),
				});
			expect(deletedTemplate).toBeUndefined();
		});

		test("should return proper GraphQL fields for deleted template", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);

			// Get admin user ID
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			const currentUserResult = await mercuriusClient.query(Query_currentUser, {
				headers: { authorization: `bearer ${adminToken}` },
			});
			const adminUserId = currentUserResult.data?.currentUser?.id;
			assertToBeNonNullish(adminUserId);

			const { templateId } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			const result = await mercuriusClient.mutate(
				Mutation_deleteEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: templateId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteEntireRecurringEventSeries).toMatchObject({
				id: templateId,
				name: "Monthly Board Meeting",
				description: "Monthly board meeting for decision making",
				location: "Boardroom",
				allDay: false,
				isPublic: false,
				isRegisterable: true,
				isRecurringEventTemplate: true,
				organization: {
					id: organizationId,
				},
				creator: {
					id: adminUserId,
				},
				attachments: [],
			});
		});
	});
});
