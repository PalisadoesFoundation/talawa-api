import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_eventsByCreator,
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

suite("Query field eventsByCreator", () => {
	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code when userId is not a valid UUID", async () => {
			const result = await mercuriusClient.query(Query_eventsByCreator, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					userId: "invalid-uuid",
				},
			});
			expect(result.data?.eventsByCreator).toBeUndefined();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["userId"],
									message: "Invalid uuid",
								}),
							]),
						}),
						path: ["eventsByCreator"],
					}),
				]),
			);
		});
	});

	suite("when user is not authenticated", () => {
		test("should return an error with unauthenticated code", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByCreator, {
				variables: {
					userId,
				},
			});
			expect(result.data?.eventsByCreator).toBeUndefined();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						path: ["eventsByCreator"],
					}),
				]),
			);
		});
	});

	suite("when the user does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.query(Query_eventsByCreator, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					userId: faker.string.uuid(),
				},
			});
			expect(result.data?.eventsByCreator).toBeUndefined();
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
						path: ["eventsByCreator"],
					}),
				]),
			);
		});
	});

	suite("authorization", () => {
		test("should allow querying own events", async () => {
			const { userId, authToken: userToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);
			assertToBeNonNullish(userToken);

			const result = await mercuriusClient.query(Query_eventsByCreator, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId },
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByCreator).toBeDefined();
		});

		test("should not allow querying other user's events as regular user", async () => {
			const { authToken: userToken } = await createRegularUserUsingAdmin();
			const { userId: otherUserId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(otherUserId);

			const result = await mercuriusClient.query(Query_eventsByCreator, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId: otherUserId },
			});
			expect(result.data?.eventsByCreator).toBeUndefined();
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

		test("should allow admin to query any user's events", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByCreator, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId },
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByCreator).toBeDefined();
		});
	});

	suite("when getting events by creator", () => {
		test("should return empty array when user has created no events", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByCreator, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId },
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByCreator).toEqual([]);
		});

		test("should return standalone events created by user", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Events By Creator Test Org ${faker.string.ulid()}`,
							description: "Organization for testing",
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
							name: "Test Event 1",
							description: "First test event",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const event1Id = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(event1Id);

			const result = await mercuriusClient.query(Query_eventsByCreator, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId: adminUserId },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByCreator as
				| Array<{ id: string; name: string; creator: { id: string } }>
				| undefined;
			expect(events).toBeDefined();
			expect(Array.isArray(events)).toBe(true);

			const testEvent = events?.find((e) => e.id === event1Id);
			expect(testEvent).toBeDefined();
			expect(testEvent).toMatchObject({
				id: event1Id,
				name: "Test Event 1",
				creator: { id: adminUserId },
			});
		});

		test("should return multiple standalone events created by user, sorted by startAt", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Multi Events Test Org ${faker.string.ulid()}`,
							description: "Organization for testing",
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

			const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
			const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;

			await mercuriusClient.mutate(Mutation_createEvent, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Later Event",
						description: "Event in the future",
						organizationId: orgId,
						startAt: new Date(nextWeek).toISOString(),
						endAt: new Date(nextWeek + 60 * 60 * 1000).toISOString(),
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createEvent, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Earlier Event",
						description: "Event tomorrow",
						organizationId: orgId,
						startAt: new Date(tomorrow).toISOString(),
						endAt: new Date(tomorrow + 60 * 60 * 1000).toISOString(),
					},
				},
			});

			const result = await mercuriusClient.query(Query_eventsByCreator, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId: adminUserId },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByCreator as
				| Array<{ id: string; name: string }>
				| undefined;
			expect(events).toBeDefined();

			const testEvents = events?.filter(
				(e: { name: string }) =>
					e.name === "Earlier Event" || e.name === "Later Event",
			);
			expect(testEvents?.length).toBeGreaterThanOrEqual(2);

			const earlierIdx = testEvents?.findIndex(
				(e: { name: string }) => e.name === "Earlier Event",
			);
			const laterIdx = testEvents?.findIndex(
				(e: { name: string }) => e.name === "Later Event",
			);

			assertToBeNonNullish(earlierIdx);
			assertToBeNonNullish(laterIdx);
			expect(earlierIdx).toBeLessThan(laterIdx);
		});

		test("should sort events with same start time by ID", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Same Time Sort Org ${faker.string.ulid()}`,
							description: "Organization for testing",
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
			const sameStartTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
			const sameEndTime = new Date(sameStartTime.getTime() + 60 * 60 * 1000);

			await mercuriusClient.mutate(Mutation_createEvent, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Same Time Event A",
						description: "First event at same time",
						organizationId: orgId,
						startAt: sameStartTime.toISOString(),
						endAt: sameEndTime.toISOString(),
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createEvent, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Same Time Event B",
						description: "Second event at same time",
						organizationId: orgId,
						startAt: sameStartTime.toISOString(),
						endAt: sameEndTime.toISOString(),
					},
				},
			});

			const result = await mercuriusClient.query(Query_eventsByCreator, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId: adminUserId },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByCreator as
				| Array<{ id: string; name: string; startAt: string }>
				| undefined;
			expect(events).toBeDefined();

			// Find the two events with same start time
			const sameTimeEvents = events?.filter(
				(e) => e.name === "Same Time Event A" || e.name === "Same Time Event B",
			);
			expect(sameTimeEvents?.length).toBe(2);

			// The events should be sorted by ID when start time is the same
			if (sameTimeEvents && sameTimeEvents.length === 2) {
				const firstEvent = sameTimeEvents[0];
				const secondEvent = sameTimeEvents[1];
				assertToBeNonNullish(firstEvent);
				assertToBeNonNullish(secondEvent);
				// Events with same start time should be sorted by ID
				expect(firstEvent.id.localeCompare(secondEvent.id)).toBeLessThan(0);
			}
		});

		test("should handle recurring event templates even when no instances are generated", async () => {
			const { userId: creatorId, authToken: creatorToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(creatorId);
			assertToBeNonNullish(creatorToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Recurring Template Org ${faker.string.ulid()}`,
							description: "Organization for testing",
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
						memberId: creatorId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			// Create a recurring event starting tomorrow (within generation window)
			const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
			const tomorrowEndDate = new Date(tomorrowDate);
			tomorrowEndDate.setHours(tomorrowEndDate.getHours() + 1);

			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${creatorToken}` },
					variables: {
						input: {
							name: "Creator Recurring Tomorrow Event",
							description: "Recurring event starting tomorrow",
							organizationId: orgId,
							startAt: tomorrowDate.toISOString(),
							endAt: tomorrowEndDate.toISOString(),
							recurrence: {
								frequency: "DAILY",
								count: 3,
							},
						},
					},
				},
			);
			expect(createEventResult.errors).toBeUndefined();

			// Query should succeed (may return 0 events if no instances generated)
			const result = await mercuriusClient.query(Query_eventsByCreator, {
				headers: { authorization: `bearer ${creatorToken}` },
				variables: { userId: creatorId },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByCreator).toBeDefined();
			expect(Array.isArray(result.data?.eventsByCreator)).toBe(true);
		});

		// TODO: Test for recurring events skipped - instance generation system not generating instances
		// See issue #4018 - recurring event instances are not being materialized correctly
		// test("should return instances of recurring events created by user", async () => { ... });
	});

	suite("error handling", () => {
		test("should handle database errors gracefully", async () => {
			const { userId, authToken: userToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);
			assertToBeNonNullish(userToken);

			// Mock the drizzle client to throw an error
			const spy = vi.spyOn(server.drizzleClient.query.eventsTable, "findMany");
			spy.mockRejectedValueOnce(new Error("Database connection failed"));

			try {
				const result = await mercuriusClient.query(Query_eventsByCreator, {
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
	});
});
