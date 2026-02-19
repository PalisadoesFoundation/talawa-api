import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import {
	eventsTable,
	recurrenceRulesTable,
	recurringEventInstancesTable,
} from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_checkIn,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_currentUser,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(adminUserId);

suite("Mutation field checkIn", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_checkIn, {
				variables: {
					data: {
						userId: faker.string.uuid(),
						eventId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.checkIn).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["checkIn"],
					}),
				]),
			);
		});
	});

	suite("when all inputs are valid for a standalone event", () => {
		test("should successfully check in the user and return the check-in record", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `CheckIn Test Org ${faker.string.ulid()}`,
							description: "Organization for check-in testing",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			if (createOrgResult.errors) {
				console.log("Create org errors:", createOrgResult.errors);
			}
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add admin as organization member with administrator role
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "CheckIn Test Event",
							description: "Event for check-in testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Check in the user
			const checkInResult = await mercuriusClient.mutate(Mutation_checkIn, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId,
					},
				},
			});

			expect(checkInResult.data?.checkIn).toBeDefined();
			expect(checkInResult.data?.checkIn?.id).toBeDefined();
			expect(checkInResult.data?.checkIn?.feedbackSubmitted).toBe(false);
			expect(checkInResult.errors).toBeUndefined();
		});
	});

	suite("when recurringEventInstanceId is provided but does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Try to check in with non-existent recurringEventInstanceId
			const result = await mercuriusClient.mutate(Mutation_checkIn, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						recurringEventInstanceId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.checkIn).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["checkIn"],
					}),
				]),
			);
		});
	});

	suite("when userId is provided but does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_checkIn, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId: faker.string.uuid(),
						eventId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.checkIn).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["checkIn"],
					}),
				]),
			);
		});
	});

	suite("when eventId is provided but does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			// Create a valid user first
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Try to check in with non-existent eventId
			const result = await mercuriusClient.mutate(Mutation_checkIn, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.checkIn).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["checkIn"],
					}),
				]),
			);
		});
	});

	suite("when neither eventId nor recurringEventInstanceId is provided", () => {
		test("should return an error with invalid_arguments extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_checkIn, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.checkIn).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["checkIn"],
					}),
				]),
			);
		});
	});

	suite("when all inputs are valid for a recurring event instance", () => {
		test("should successfully check in the user and return the check-in record", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `CheckIn Recurring Test Org ${faker.string.ulid()}`,
							description: "Organization for recurring event check-in testing",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add admin as organization member with administrator role
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			// Create a base recurring event directly in the database
			const [baseEvent] = await server.drizzleClient
				.insert(eventsTable)
				.values({
					name: "Recurring CheckIn Test Event",
					description: "Base recurring event for check-in testing",
					organizationId: orgId,
					startAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
					endAt: new Date(Date.now() + 25 * 60 * 60 * 1000),
					isRecurringEventTemplate: true,
					creatorId: adminUserId,
				})
				.returning({ id: eventsTable.id });
			assertToBeNonNullish(baseEvent);
			const baseEventId = baseEvent.id;

			// Create a recurrence rule
			const [recurrenceRule] = await server.drizzleClient
				.insert(recurrenceRulesTable)
				.values({
					recurrenceRuleString: "RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=10",
					frequency: "WEEKLY",
					interval: 1,
					recurrenceStartDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
					latestInstanceDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
					baseRecurringEventId: baseEventId,
					organizationId: orgId,
					creatorId: adminUserId,
				})
				.returning({ id: recurrenceRulesTable.id });
			assertToBeNonNullish(recurrenceRule);
			const recurrenceRuleId = recurrenceRule.id;

			// Create a recurring event instance
			const [instance] = await server.drizzleClient
				.insert(recurringEventInstancesTable)
				.values({
					baseRecurringEventId: baseEventId,
					recurrenceRuleId: recurrenceRuleId,
					originalSeriesId: baseEventId,
					originalInstanceStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
					actualStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
					actualEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
					organizationId: orgId,
					sequenceNumber: 1,
					totalCount: 10,
				})
				.returning({ id: recurringEventInstancesTable.id });
			assertToBeNonNullish(instance);
			const instanceId = instance.id;

			// Create a user
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Check in the user to the recurring event instance
			const checkInResult = await mercuriusClient.mutate(Mutation_checkIn, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						recurringEventInstanceId: instanceId,
					},
				},
			});

			expect(checkInResult.errors).toBeUndefined();
		});
	});

	suite("when user is already checked in to the event", () => {
		test("should return an error with invalid_arguments extensions code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `CheckIn Already Checked In Test Org ${faker.string.ulid()}`,
							description: "Organization for already checked in testing",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add admin as organization member with administrator role
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Already Checked In Test Event",
							description: "Event for already checked in testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a user
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Check in the user first time
			const firstCheckInResult = await mercuriusClient.mutate(
				Mutation_checkIn,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							eventId,
						},
					},
				},
			);

			expect(firstCheckInResult.data?.checkIn).toBeDefined();
			expect(firstCheckInResult.errors).toBeUndefined();

			// Try to check in the same user again
			const secondCheckInResult = await mercuriusClient.mutate(
				Mutation_checkIn,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							eventId,
						},
					},
				},
			);

			expect(secondCheckInResult.data?.checkIn).toBeNull();
			expect(secondCheckInResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["checkIn"],
					}),
				]),
			);
		});
	});

	suite("when user is not authorized to check in attendees", () => {
		test("should return an error with unauthorized_action extensions code", async () => {
			// Create organization and event as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `CheckIn Unauthorized Test Org ${faker.string.ulid()}`,
							description: "Organization for unauthorized check-in testing",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add admin as organization member with administrator role
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Unauthorized CheckIn Test Event",
							description: "Event for unauthorized check-in testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Create a regular user (non-admin) and get their auth token
			const { userId: regularUserId, authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserId);
			assertToBeNonNullish(regularUserToken);

			// Create another user to check in
			const { userId: userToCheckInId } = await createRegularUserUsingAdmin();
			console.log("userToCheckInId:", userToCheckInId);
			assertToBeNonNullish(userToCheckInId);

			// Try to check in as regular user (should fail with unauthorized_action)
			const checkInResult = await mercuriusClient.mutate(Mutation_checkIn, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: {
					data: {
						userId: userToCheckInId,
						eventId,
					},
				},
			});

			expect(checkInResult.data?.checkIn).toBeNull();
			expect(checkInResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["checkIn"],
					}),
				]),
			);
		});
	});
});
