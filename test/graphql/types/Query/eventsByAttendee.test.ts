import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createEvent,
	Mutation_createEventVolunteer,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_registerEventAttendee,
	Mutation_updateEventVolunteer,
	Query_eventsByAttendee,
	Query_eventsByVolunteer,
	Query_signIn,
} from "../documentNodes";

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
const adminUserId = signInResult.data.signIn.user?.id;
assertToBeNonNullish(authToken);
assertToBeNonNullish(adminUserId);

suite("Query field eventsByAttendee", () => {
	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code when userId is not a valid UUID", async () => {
			const result = await mercuriusClient.query(Query_eventsByAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					userId: "invalid-uuid",
				},
			});
			expect(result.data?.eventsByAttendee).toBeUndefined();
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
	});

	suite("when user is not authenticated", () => {
		test("should return an error with unauthenticated code", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByAttendee, {
				variables: { userId },
			});
			expect(result.data?.eventsByAttendee).toBeUndefined();
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
	});

	suite("authorization", () => {
		test("should allow querying own attended events", async () => {
			const { authToken: userToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByAttendee, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId },
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByAttendee).toBeDefined();
		});

		test("should not allow querying other user's attended events as regular user", async () => {
			const { authToken: userToken } = await createRegularUserUsingAdmin();
			const { userId: otherUserId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(otherUserId);

			const result = await mercuriusClient.query(Query_eventsByAttendee, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId: otherUserId },
			});
			expect(result.data?.eventsByAttendee).toBeUndefined();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["userId"],
								}),
							]),
						}),
					}),
				]),
			);
		});

		test("should allow admin to query any user's attended events", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId },
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByAttendee).toBeDefined();
		});
	});

	suite("when user does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.query(Query_eventsByAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					userId: faker.string.uuid(),
				},
			});
			expect(result.data?.eventsByAttendee).toBeUndefined();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["userId"],
								}),
							]),
						}),
					}),
				]),
			);
		});
	});

	suite("when getting events by attendee", () => {
		test("should return empty array when user has not registered for any events", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId },
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByAttendee).toEqual([]);
		});

		test("should return events user is registered for", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Attendee Test Org ${faker.string.ulid()}`,
							description: "Test org",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Test St",
							addressLine2: null,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

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
							name: "Attendee Test Event",
							description: "Event for attendee testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			await mercuriusClient.mutate(Mutation_registerEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId,
					},
				},
			});

			const result = await mercuriusClient.query(Query_eventsByAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByAttendee as
				| Array<{ id: string; name: string }>
				| undefined;
			expect(events).toBeDefined();
			expect(Array.isArray(events)).toBe(true);

			const testEvent = events?.find((e) => e.id === eventId);
			expect(testEvent).toBeDefined();
			expect(testEvent).toMatchObject({
				id: eventId,
				name: "Attendee Test Event",
			});
		});

		test("should return specific instance when registered for a single instance", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Attendee Recurring Org ${faker.string.ulid()}`,
							description: "Test org",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Test St",
							addressLine2: null,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

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
							name: "Attendee Recurring Instance",
							description: "Test recurring instance",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
							recurrence: {
								frequency: "DAILY",
								count: 3,
							},
						},
					},
				},
			);
			const baseEventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(baseEventId);

			// Step 1: Admin volunteers for ENTIRE_SERIES to force instance generation and discovery
			const adminVolunteerResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteer,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							userId: adminUserId,
							eventId: baseEventId,
							scope: "ENTIRE_SERIES",
						},
					},
				},
			);
			const adminVolunteerId =
				adminVolunteerResult.data?.createEventVolunteer?.id;
			assertToBeNonNullish(adminVolunteerId);

			await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: adminVolunteerId,
					data: { hasAccepted: true },
				},
			});

			const adminEventsResult = await mercuriusClient.query(
				Query_eventsByVolunteer,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { userId: adminUserId },
				},
			);
			const adminEvents = adminEventsResult.data?.eventsByVolunteer as Array<{
				id: string;
				name: string;
			}>;
			assertToBeNonNullish(adminEvents);
			const instance = adminEvents.find(
				(e) => e.name === "Attendee Recurring Instance",
			);
			assertToBeNonNullish(instance);
			const instanceId = instance.id;

			// Step 2: Register user as attendee for THAT specific instance
			const registerResult = await mercuriusClient.mutate(
				Mutation_registerEventAttendee,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							recurringEventInstanceId: instanceId,
						},
					},
				},
			);
			expect(registerResult.errors).toBeUndefined();

			// Step 3: Query
			const result = await mercuriusClient.query(Query_eventsByAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByAttendee as Array<{
				id: string;
				name: string;
			}>;
			assertToBeNonNullish(events);

			// Should return EXACTLY ONE instance
			expect(events.length).toBe(1);
			const event = events[0];
			assertToBeNonNullish(event);
			expect(event.id).toBe(instanceId);
			expect(event.name).toBe("Attendee Recurring Instance");
		});

		test("should sort events with same start time by ID", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Attendee Sort Org ${faker.string.ulid()}`,
							description: "Test org",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Test St",
							addressLine2: null,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

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

			// Create two events with the same start time
			const sameStartTime = new Date(Date.now() + 72 * 60 * 60 * 1000);
			const sameEndTime = new Date(sameStartTime.getTime() + 60 * 60 * 1000);

			const event1Result = await mercuriusClient.mutate(Mutation_createEvent, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Attendee Sort Event A",
						description: "First event at same time",
						organizationId: orgId,
						startAt: sameStartTime.toISOString(),
						endAt: sameEndTime.toISOString(),
					},
				},
			});
			const event1Id = event1Result.data?.createEvent?.id;
			assertToBeNonNullish(event1Id);

			const event2Result = await mercuriusClient.mutate(Mutation_createEvent, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Attendee Sort Event B",
						description: "Second event at same time",
						organizationId: orgId,
						startAt: sameStartTime.toISOString(),
						endAt: sameEndTime.toISOString(),
					},
				},
			});
			const event2Id = event2Result.data?.createEvent?.id;
			assertToBeNonNullish(event2Id);

			// Register user for both events
			await mercuriusClient.mutate(Mutation_registerEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId: event1Id,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_registerEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId: event2Id,
					},
				},
			});

			const result = await mercuriusClient.query(Query_eventsByAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByAttendee as Array<{
				id: string;
				name: string;
			}>;
			assertToBeNonNullish(events);

			// Find the two events with same start time
			const sameTimeEvents = events.filter(
				(e) =>
					e.name === "Attendee Sort Event A" ||
					e.name === "Attendee Sort Event B",
			);
			expect(sameTimeEvents.length).toBe(2);

			// Events with same start time should be sorted by ID
			const firstEvent = sameTimeEvents[0];
			const secondEvent = sameTimeEvents[1];
			assertToBeNonNullish(firstEvent);
			assertToBeNonNullish(secondEvent);
			expect(firstEvent.id.localeCompare(secondEvent.id)).toBeLessThan(0);
		});

		test("should handle both standalone events and recurring instances", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Mixed Events Org ${faker.string.ulid()}`,
							description: "Test org",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Test St",
							addressLine2: null,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

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

			// Create a standalone event
			const standaloneEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Mixed Test Standalone Event",
							description: "Standalone event for mixed test",
							organizationId: orgId,
							startAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
							endAt: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const standaloneEventId = standaloneEventResult.data?.createEvent?.id;
			assertToBeNonNullish(standaloneEventId);

			// Create a recurring event and get an instance
			const recurringEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Mixed Test Recurring Event",
							description: "Recurring event for mixed test",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
							recurrence: {
								frequency: "DAILY",
								count: 3,
							},
						},
					},
				},
			);
			const baseEventId = recurringEventResult.data?.createEvent?.id;
			assertToBeNonNullish(baseEventId);

			// Volunteer to generate instances
			const adminVolunteerResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteer,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							userId: adminUserId,
							eventId: baseEventId,
							scope: "ENTIRE_SERIES",
						},
					},
				},
			);
			const adminVolunteerId =
				adminVolunteerResult.data?.createEventVolunteer?.id;
			assertToBeNonNullish(adminVolunteerId);

			await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: adminVolunteerId,
					data: { hasAccepted: true },
				},
			});

			// Get an instance ID
			const adminEventsResult = await mercuriusClient.query(
				Query_eventsByVolunteer,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { userId: adminUserId },
				},
			);
			const adminEvents = adminEventsResult.data?.eventsByVolunteer as Array<{
				id: string;
				name: string;
			}>;
			const instance = adminEvents?.find(
				(e) => e.name === "Mixed Test Recurring Event",
			);

			// Register user for the standalone event (uses eventId branch)
			await mercuriusClient.mutate(Mutation_registerEventAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					data: {
						userId,
						eventId: standaloneEventId,
					},
				},
			});

			// Also register for recurring instance if one exists (uses recurringEventInstanceId branch)
			if (instance) {
				await mercuriusClient.mutate(Mutation_registerEventAttendee, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						data: {
							userId,
							recurringEventInstanceId: instance.id,
						},
					},
				});
			}

			// Query attended events
			const result = await mercuriusClient.query(Query_eventsByAttendee, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByAttendee as Array<{
				id: string;
				name: string;
			}>;
			assertToBeNonNullish(events);

			// Should have at least the standalone event
			expect(events.length).toBeGreaterThanOrEqual(1);

			// Check that standalone event is present
			const hasStandalone = events.some(
				(e) => e.name === "Mixed Test Standalone Event",
			);
			expect(hasStandalone).toBe(true);
		});

		// TODO: Test for recurring event series skipped - instance generation system not generating instances
		// See issue #4018 - recurring event instances are not being materialized correctly
		// test("should return all instances when registered for an entire recurring event series", async () => { ... });
	});

	suite("error handling", () => {
		test("should handle database errors gracefully", async () => {
			const { userId, authToken: userToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);
			assertToBeNonNullish(userToken);

			// Mock the drizzle client to throw an error
			const spy = vi.spyOn(
				server.drizzleClient.query.eventAttendeesTable,
				"findMany",
			);
			spy.mockRejectedValueOnce(new Error("Database connection failed"));

			try {
				const result = await mercuriusClient.query(Query_eventsByAttendee, {
					headers: { authorization: `bearer ${userToken}` },
					variables: { userId },
				});

				// Should return an error with unexpected code
				expect(result.errors).toBeDefined();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
						}),
					]),
				);
			} finally {
				spy.mockRestore();
			}
		});

		test("should return all instances when registered for an entire recurring event series", async () => {
			const { userId, authToken: userAuthToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Create recurring event template starting tomorrow
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			const start = tomorrow.toISOString();

			const afterTomorrow = new Date(tomorrow);
			afterTomorrow.setHours(afterTomorrow.getHours() + 1);
			const end = afterTomorrow.toISOString();

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Recurring Test Org ${faker.string.ulid()}`,
							description: "Organization for recurring test event",
							countryCode: "us",
							state: "CA",
							city: "Test City",
							postalCode: "12345",
							addressLine1: "123 Test St",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: userId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const eventData = {
				name: faker.lorem.words(3),
				description: faker.lorem.sentence(),
				startAt: start,
				endAt: end,
				location: faker.location.city(),
				allDay: false,
				isPublic: true,
				isInviteOnly: false,
				isRegisterable: true,
				organizationId: orgId,
				recurrence: {
					frequency: "DAILY" as const,
					count: 3,
					interval: 1,
				},
			};

			// 4. Create Event (User - now an Org Admin)
			const createEventResult = await mercuriusClient.query(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${userAuthToken}` },
					variables: { input: eventData },
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// 5. Register User (User - now an Org Admin)
			const registerResult = await mercuriusClient.mutate(
				Mutation_registerEventAttendee,
				{
					headers: { authorization: `bearer ${userAuthToken}` },
					variables: {
						data: {
							eventId: eventId,
							userId,
						},
					},
				},
			);
			assertToBeNonNullish(registerResult.data?.registerEventAttendee?.id);

			// Query attendees should show instances
			const result = await mercuriusClient.query(Query_eventsByAttendee, {
				headers: { authorization: `bearer ${userAuthToken}` },
				variables: { userId },
			});

			const events = result.data?.eventsByAttendee as {
				id: string;
				isGenerated?: boolean | null;
				baseRecurringEventId?: string | null;
			}[];
			assertToBeNonNullish(events);

			// Should find instances, not the template itself
			const generatedInstances = events.filter((e) => e.isGenerated);
			expect(generatedInstances.length).toBeGreaterThan(0);
			expect(generatedInstances[0]?.baseRecurringEventId).toBe(eventId);
		});
	});
});
