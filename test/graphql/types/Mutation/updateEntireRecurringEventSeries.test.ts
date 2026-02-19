import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { expect, suite, test } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createUser,
	Mutation_updateEntireRecurringEventSeries,
	Query_currentUser,
} from "../documentNodes";

// Helper to safely get instance ID with assertion
function getInstanceId(instanceIds: string[], index: number): string {
	const instanceId = instanceIds[index];
	assertToBeNonNullish(instanceId);
	return instanceId;
}

// Helper to add organization membership
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
): Promise<{
	templateId: string;
	instanceIds: string[];
	originalSeriesId: string;
}> {
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
		originalSeriesId,
	};
}

// Helper to create a split series scenario
async function createSplitSeriesScenario(
	organizationId: string,
	creatorId: string,
	originalSeriesId: string,
): Promise<{ templateId: string; instanceIds: string[] }> {
	// Create a second template that shares the same originalSeriesId (simulating a split)
	const [secondTemplate] = await server.drizzleClient
		.insert(eventsTable)
		.values({
			name: "Weekly Team Meeting",
			description: "Weekly team sync meeting",
			organizationId,
			creatorId,
			isRecurringEventTemplate: true,
			startAt: new Date("2024-04-01T10:00:00Z"),
			endAt: new Date("2024-04-01T11:00:00Z"),
			allDay: false,
			location: "Conference Room",
			isPublic: false,
			isRegisterable: true,
		})
		.returning();

	assertToBeNonNullish(secondTemplate);

	// Create recurrence rule with originalSeriesId pointing to the first series
	const [secondRecurrenceRule] = await server.drizzleClient
		.insert(recurrenceRulesTable)
		.values({
			baseRecurringEventId: secondTemplate.id,
			originalSeriesId, // This links it to the original series
			recurrenceStartDate: new Date("2024-04-01"),
			recurrenceEndDate: new Date("2024-12-31"),
			frequency: "WEEKLY",
			interval: 1,
			organizationId,
			creatorId,
			recurrenceRuleString: "RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO",
			latestInstanceDate: new Date("2024-04-15"),
		})
		.returning();

	assertToBeNonNullish(secondRecurrenceRule);

	// Create instances for the split series
	const splitInstancesData = [
		{
			baseRecurringEventId: secondTemplate.id,
			recurrenceRuleId: secondRecurrenceRule.id,
			originalSeriesId,
			organizationId,
			originalInstanceStartTime: new Date("2024-04-01T10:00:00Z"),
			actualStartTime: new Date("2024-04-01T10:00:00Z"),
			actualEndTime: new Date("2024-04-01T11:00:00Z"),
			sequenceNumber: 1,
		},
		{
			baseRecurringEventId: secondTemplate.id,
			recurrenceRuleId: secondRecurrenceRule.id,
			originalSeriesId,
			organizationId,
			originalInstanceStartTime: new Date("2024-04-08T10:00:00Z"),
			actualStartTime: new Date("2024-04-08T10:00:00Z"),
			actualEndTime: new Date("2024-04-08T11:00:00Z"),
			sequenceNumber: 2,
		},
	];

	const splitInstances = await server.drizzleClient
		.insert(recurringEventInstancesTable)
		.values(splitInstancesData)
		.returning();

	return {
		templateId: secondTemplate.id,
		instanceIds: splitInstances.map((i) => i.id),
	};
}

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(adminUserId);

suite("Mutation field updateEntireRecurringEventSeries", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated Event Name",
						},
					},
				},
			);
			expect(result.data?.updateEntireRecurringEventSeries).toBeNull();
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
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							// Pass an invalid UUID format that will pass GraphQL validation but fail Zod validation
							id: "invalid-uuid-format",
							name: "Updated Event Name",
						},
					},
				},
			);
			expect(result.data?.updateEntireRecurringEventSeries ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
					}),
				]),
			);
		});

		test("should return an error when no fields are provided for update", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: faker.string.uuid(),
							// No name or description provided
						},
					},
				},
			);
			expect(result.data?.updateEntireRecurringEventSeries ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									message: "At least one field must be provided for update.",
								}),
							]),
						}),
					}),
				]),
			);
		});

		test("should return an error when recurring event instance is not found", async () => {
			const nonExistentId = faker.string.uuid();
			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: nonExistentId,
							name: "Updated Event Name",
						},
					},
				},
			);
			expect(result.data?.updateEntireRecurringEventSeries ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
					}),
				]),
			);
		});

		test("should return an error when trying to update a cancelled recurring event instance", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);
			const { instanceIds } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			// Mark the first instance as cancelled
			const firstInstanceId = instanceIds[0];
			assertToBeNonNullish(firstInstanceId);

			await server.drizzleClient
				.update(recurringEventInstancesTable)
				.set({ isCancelled: true })
				.where(eq(recurringEventInstancesTable.id, firstInstanceId));

			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: getInstanceId(instanceIds, 0),
							name: "Updated Event Name",
						},
					},
				},
			);
			expect(result.data?.updateEntireRecurringEventSeries ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
									message:
										"Cannot update a cancelled recurring event instance.",
								}),
							]),
						}),
					}),
				]),
			);
		});

		test("should return an error when user is not an administrator and not the creator", async () => {
			// Create organization
			const organizationId = await createOrganizationAndGetId(authToken);

			// Admin creates the recurring event series
			const { instanceIds } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			// Create a regular user
			const regularUserEmail = faker.internet.email();
			const regularUserPassword = "password123";
			const regularUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							emailAddress: regularUserEmail,
							password: regularUserPassword,
							name: "Regular User",
							role: "regular",
							isEmailAddressVerified: true,
						},
					},
				},
			);
			const regularUser = regularUserResult.data?.createUser?.user;
			assertToBeNonNullish(regularUser);
			const signInRes = await server.inject({
				method: "POST",
				url: "/auth/signin",
				payload: {
					email: regularUserEmail,
					password: regularUserPassword,
				},
			});
			const accessCookie = signInRes.cookies.find(
				(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			);
			const regularUserAuthToken = accessCookie?.value;
			assertToBeNonNullish(regularUserAuthToken);

			await addMembership(organizationId, regularUser.id, "regular");

			// Try to update event series as regular user (not creator, not admin)
			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${regularUserAuthToken}` },
					variables: {
						input: {
							id: getInstanceId(instanceIds, 0),
							name: "Updated Event Name",
						},
					},
				},
			);

			expect(result.data?.updateEntireRecurringEventSeries ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
					}),
				]),
			);
		});

		test("should return an error when user is not a member of the organization", async () => {
			// Create organization
			const organizationId = await createOrganizationAndGetId(authToken);

			// Admin creates the recurring event series
			const { instanceIds } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			// Create a regular user
			const outsiderUserEmail = faker.internet.email();
			const outsiderUserPassword = "password123";
			await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						emailAddress: outsiderUserEmail,
						password: outsiderUserPassword,
						name: "Outsider User",
						role: "regular",
						isEmailAddressVerified: true,
					},
				},
			});

			const signInOutsiderRes = await server.inject({
				method: "POST",
				url: "/auth/signin",
				payload: {
					email: outsiderUserEmail,
					password: outsiderUserPassword,
				},
			});
			const outsiderCookie = signInOutsiderRes.cookies.find(
				(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			);
			const outsiderUserAuthToken = outsiderCookie?.value;
			assertToBeNonNullish(outsiderUserAuthToken);

			// Note: We don't add this user to the organization membership

			// Try to update event series as outsider user (no membership)
			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${outsiderUserAuthToken}` },
					variables: {
						input: {
							id: getInstanceId(instanceIds, 0),
							name: "Updated Event Name",
						},
					},
				},
			);

			expect(result.data?.updateEntireRecurringEventSeries ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
					}),
				]),
			);
		});

		test("should allow regular user who is the creator to update event series", async () => {
			// Create organization
			const organizationId = await createOrganizationAndGetId(authToken);

			// Create a regular user
			const creatorUserEmail = faker.internet.email();
			const creatorUserPassword = "password123";
			const creatorUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							emailAddress: creatorUserEmail,
							password: creatorUserPassword,
							name: "Creator User",
							role: "regular",
							isEmailAddressVerified: true,
						},
					},
				},
			);

			const creatorUser = creatorUserResult.data?.createUser?.user;
			assertToBeNonNullish(creatorUser);

			const signInCreatorRes = await server.inject({
				method: "POST",
				url: "/auth/signin",
				payload: {
					email: creatorUserEmail,
					password: creatorUserPassword,
				},
			});
			const creatorCookie = signInCreatorRes.cookies.find(
				(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			);
			const creatorUserAuthToken = creatorCookie?.value;
			assertToBeNonNullish(creatorUserAuthToken);

			// Add creator user as regular member to organization
			await addMembership(organizationId, creatorUser.id, "regular");

			// Creator user creates the recurring event series
			const { instanceIds } = await createRecurringEventWithInstances(
				organizationId,
				creatorUser.id, // Creator user as the creator
			);

			// Try to update event series as creator user (not admin but is creator)
			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${creatorUserAuthToken}` },
					variables: {
						input: {
							id: getInstanceId(instanceIds, 0),
							name: "Updated Event Name by Creator",
						},
					},
				},
			);

			// Should succeed because user is the creator
			// Note: There may be field-level authorization errors for creator/updater fields
			// but the mutation itself should succeed
			expect(result.data?.updateEntireRecurringEventSeries).toEqual(
				expect.objectContaining({
					id: getInstanceId(instanceIds, 0),
					name: "Updated Event Name by Creator",
				}),
			);

			// If there are errors, they should only be field-level authorization errors
			if (result.errors) {
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthorized_action",
							}),
							path: expect.arrayContaining([
								"updateEntireRecurringEventSeries",
							]),
						}),
					]),
				);
			}
		});

		test("should allow organization administrator to update event series created by another user", async () => {
			// Create organization
			const organizationId = await createOrganizationAndGetId(authToken);

			// Create a regular user who will be the creator
			const creatorUserEmail = faker.internet.email();
			const creatorUserPassword = "password123";
			const creatorUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							emailAddress: creatorUserEmail,
							password: creatorUserPassword,
							name: "Creator User",
							role: "regular",
							isEmailAddressVerified: true,
						},
					},
				},
			);

			const creatorUser = creatorUserResult.data?.createUser?.user;
			assertToBeNonNullish(creatorUser);

			// Add creator user as regular member to organization
			await addMembership(organizationId, creatorUser.id, "regular");

			// Creator user creates the recurring event series
			const { instanceIds } = await createRecurringEventWithInstances(
				organizationId,
				creatorUser.id, // Creator user as the creator
			);

			// Create another user who will be an organization administrator
			const adminUserEmail = faker.internet.email();
			const adminUserPassword = "password123";
			const adminUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							emailAddress: adminUserEmail,
							password: adminUserPassword,
							name: "Admin User",
							role: "regular",
							isEmailAddressVerified: true,
						},
					},
				},
			);

			const adminUser = adminUserResult.data?.createUser?.user;
			assertToBeNonNullish(adminUser);

			const signInAdminRes = await server.inject({
				method: "POST",
				url: "/auth/signin",
				payload: {
					email: adminUserEmail,
					password: adminUserPassword,
				},
			});
			const adminCookie = signInAdminRes.cookies.find(
				(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			);
			const adminUserAuthToken = adminCookie?.value;
			assertToBeNonNullish(adminUserAuthToken);

			// Add admin user as administrator to organization
			await addMembership(organizationId, adminUser.id, "administrator");

			// Try to update event series as organization admin (not creator but is admin)
			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${adminUserAuthToken}` },
					variables: {
						input: {
							id: getInstanceId(instanceIds, 0),
							name: "Updated Event Name by Admin",
						},
					},
				},
			);

			// Should succeed because user is organization administrator
			expect(result.errors).toBeUndefined();
			expect(result.data?.updateEntireRecurringEventSeries).toEqual(
				expect.objectContaining({
					id: getInstanceId(instanceIds, 0),
					name: "Updated Event Name by Admin",
				}),
			);
		});

		test("should successfully update name only for entire recurring event series", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);
			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId);

			const newName = "Updated Monthly Board Meeting";

			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: getInstanceId(instanceIds, 0),
							name: newName,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateEntireRecurringEventSeries).toEqual(
				expect.objectContaining({
					id: getInstanceId(instanceIds, 0),
					name: newName,
					description: "Monthly board meeting for decision making", // Should remain unchanged
				}),
			);

			// Verify that the base template was updated
			const updatedTemplate =
				await server.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, templateId),
				});
			expect(updatedTemplate?.name).toBe(newName);
			expect(updatedTemplate?.updaterId).toBe(adminUserId);

			// Verify all instances have updated lastUpdatedAt
			const instances =
				await server.drizzleClient.query.recurringEventInstancesTable.findMany({
					where: eq(
						recurringEventInstancesTable.baseRecurringEventId,
						templateId,
					),
				});
			for (const instance of instances) {
				expect(instance.lastUpdatedAt).toBeDefined();
			}
		});
		test("should successfully update description only for entire recurring event series", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);
			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId);

			const newDescription = "Updated description for monthly board meeting";

			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: getInstanceId(instanceIds, 1), // Use a different instance
							description: newDescription,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateEntireRecurringEventSeries).toEqual(
				expect.objectContaining({
					id: getInstanceId(instanceIds, 1),
					name: "Monthly Board Meeting", // Should remain unchanged
					description: newDescription,
				}),
			);

			// Verify that the base template was updated
			const updatedTemplate =
				await server.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, templateId),
				});
			expect(updatedTemplate?.description).toBe(newDescription);
			expect(updatedTemplate?.updaterId).toBe(adminUserId);
		});

		test("should successfully update both name and description for entire recurring event series", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);
			const { templateId, instanceIds } =
				await createRecurringEventWithInstances(organizationId, adminUserId);

			const newName = "Completely Updated Meeting";
			const newDescription = "Completely updated description for the meeting";

			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: getInstanceId(instanceIds, 2), // Use the third instance
							name: newName,
							description: newDescription,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateEntireRecurringEventSeries).toEqual(
				expect.objectContaining({
					id: getInstanceId(instanceIds, 2),
					name: newName,
					description: newDescription,
				}),
			);

			// Verify that the base template was updated
			const updatedTemplate =
				await server.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, templateId),
				});
			expect(updatedTemplate?.name).toBe(newName);
			expect(updatedTemplate?.description).toBe(newDescription);
			expect(updatedTemplate?.updaterId).toBe(adminUserId);
		});

		test("should update all templates in a split series scenario", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);
			const {
				templateId: firstTemplateId,
				instanceIds: firstInstanceIds,
				originalSeriesId,
			} = await createRecurringEventWithInstances(organizationId, adminUserId);

			const { templateId: secondTemplateId } = await createSplitSeriesScenario(
				organizationId,
				adminUserId,
				originalSeriesId,
			);

			const newName = "Updated Series Name";
			const newDescription = "Updated description for entire series";

			// Update using an instance from the first template
			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: getInstanceId(firstInstanceIds, 0),
							name: newName,
							description: newDescription,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateEntireRecurringEventSeries).toEqual(
				expect.objectContaining({
					id: getInstanceId(firstInstanceIds, 0),
					name: newName,
					description: newDescription,
				}),
			);

			// Verify both templates were updated
			const firstUpdatedTemplate =
				await server.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, firstTemplateId),
				});
			const secondUpdatedTemplate =
				await server.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, secondTemplateId),
				});

			expect(firstUpdatedTemplate?.name).toBe(newName);
			expect(firstUpdatedTemplate?.description).toBe(newDescription);
			expect(secondUpdatedTemplate?.name).toBe(newName);
			expect(secondUpdatedTemplate?.description).toBe(newDescription);

			// Verify all instances across both templates have updated lastUpdatedAt
			const firstInstances =
				await server.drizzleClient.query.recurringEventInstancesTable.findMany({
					where: eq(
						recurringEventInstancesTable.baseRecurringEventId,
						firstTemplateId,
					),
				});
			const secondInstances =
				await server.drizzleClient.query.recurringEventInstancesTable.findMany({
					where: eq(
						recurringEventInstancesTable.baseRecurringEventId,
						secondTemplateId,
					),
				});

			for (const instance of [...firstInstances, ...secondInstances]) {
				expect(instance.lastUpdatedAt).toBeDefined();
			}
		});

		test("should return proper event structure with all required fields", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);
			const { instanceIds } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: getInstanceId(instanceIds, 0),
							name: "Updated Event",
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			const updatedEvent = result.data?.updateEntireRecurringEventSeries;

			expect(updatedEvent).toEqual(
				expect.objectContaining({
					id: getInstanceId(instanceIds, 0),
					name: "Updated Event",
					description: expect.any(String),
					startAt: expect.any(String),
					endAt: expect.any(String),
					allDay: expect.any(Boolean),
					location: expect.any(String),
					isPublic: expect.any(Boolean),
					isRegisterable: expect.any(Boolean),
					attachments: expect.any(Array),
				}),
			);
		});

		test("should handle edge case with non-empty string values", async () => {
			const organizationId = await createOrganizationAndGetId(authToken);
			const { instanceIds } = await createRecurringEventWithInstances(
				organizationId,
				adminUserId,
			);

			const result = await mercuriusClient.mutate(
				Mutation_updateEntireRecurringEventSeries,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: getInstanceId(instanceIds, 0),
							name: "A",
							description: "B",
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateEntireRecurringEventSeries).toEqual(
				expect.objectContaining({
					id: getInstanceId(instanceIds, 0),
					name: "A",
					description: "B",
				}),
			);
		});
	});
});
