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
	Query_eventsByAdmin,
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

suite("Query field eventsByAdmin", () => {
	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code when userId is not a valid UUID", async () => {
			const result = await mercuriusClient.query(Query_eventsByAdmin, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					userId: "invalid-uuid",
				},
			});
			expect(result.data?.eventsByAdmin).toBeUndefined();
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

			const result = await mercuriusClient.query(Query_eventsByAdmin, {
				variables: { userId },
			});
			expect(result.data?.eventsByAdmin).toBeUndefined();
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
		test("should allow querying own admin events", async () => {
			const { authToken: userToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByAdmin, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId },
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByAdmin).toBeDefined();
		});

		test("should not allow querying other user's admin events as regular user", async () => {
			const { authToken: userToken } = await createRegularUserUsingAdmin();
			const { userId: otherUserId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(otherUserId);

			const result = await mercuriusClient.query(Query_eventsByAdmin, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId: otherUserId },
			});
			expect(result.data?.eventsByAdmin).toBeUndefined();
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

		test("should allow admin to query any user's admin events", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByAdmin, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId },
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByAdmin).toBeDefined();
		});
	});

	suite("when user does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.query(Query_eventsByAdmin, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					userId: faker.string.uuid(),
				},
			});
			expect(result.data?.eventsByAdmin).toBeUndefined();
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
	});

	suite("when getting events by admin", () => {
		test("should return empty array when user is not an admin of any organization", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByAdmin, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId },
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByAdmin).toEqual([]);
		});

		test("should return events from organizations where user is admin", async () => {
			const { userId: adminUserArgVal, authToken: adminUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(adminUserArgVal);

			// Create Org
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Admin Test Org ${faker.string.ulid()}`,
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

			// Make user an admin of this org
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserArgVal,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			// Create Event in this org
			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${adminUserToken}` },
					variables: {
						input: {
							name: "Admin Org Event",
							description: "Event in org where user is admin",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			expect(createEventResult.errors).toBeUndefined();
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// User queries eventsByAdmin
			const result = await mercuriusClient.query(Query_eventsByAdmin, {
				headers: { authorization: `bearer ${adminUserToken}` },
				variables: { userId: adminUserArgVal },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByAdmin as Array<{
				id: string;
				name: string;
			}>;
			expect(events).toBeDefined();
			expect(events.length).toBeGreaterThanOrEqual(1);

			const foundEvent = events.find((e) => e.id === eventId);
			expect(foundEvent).toBeDefined();
			expect(foundEvent?.name).toBe("Admin Org Event");
		});

		test("should NOT return events from organizations where user is ONLY a regular member", async () => {
			const { userId: regularUserArgVal, authToken: regularUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularUserArgVal);

			// Create Org
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Regular Member Org ${faker.string.ulid()}`,
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

			// Make user a REGULAR member (not administrator)
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: regularUserArgVal,
						organizationId: orgId,
						role: "regular",
					},
				},
			});

			// Create Event in this org
			await mercuriusClient.mutate(Mutation_createEvent, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Regular Member Org Event",
						description: "Event",
						organizationId: orgId,
						startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
						endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
					},
				},
			});

			// User queries eventsByAdmin
			const result = await mercuriusClient.query(Query_eventsByAdmin, {
				headers: { authorization: `bearer ${regularUserToken}` },
				variables: { userId: regularUserArgVal },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByAdmin as Array<unknown>;
			expect(events).toEqual([]);
		});

		test("should sort events with same start time by ID", async () => {
			const { userId: adminUserArgVal, authToken: adminUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(adminUserArgVal);

			// Create Org
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Admin Sort Org ${faker.string.ulid()}`,
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

			// Make user an admin of this org
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserArgVal,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			// Create two events with the same start time
			const sameStartTime = new Date(Date.now() + 96 * 60 * 60 * 1000);
			const sameEndTime = new Date(sameStartTime.getTime() + 60 * 60 * 1000);

			await mercuriusClient.mutate(Mutation_createEvent, {
				headers: { authorization: `bearer ${adminUserToken}` },
				variables: {
					input: {
						name: "Admin Sort Event A",
						description: "First event at same time",
						organizationId: orgId,
						startAt: sameStartTime.toISOString(),
						endAt: sameEndTime.toISOString(),
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createEvent, {
				headers: { authorization: `bearer ${adminUserToken}` },
				variables: {
					input: {
						name: "Admin Sort Event B",
						description: "Second event at same time",
						organizationId: orgId,
						startAt: sameStartTime.toISOString(),
						endAt: sameEndTime.toISOString(),
					},
				},
			});

			// User queries eventsByAdmin
			const result = await mercuriusClient.query(Query_eventsByAdmin, {
				headers: { authorization: `bearer ${adminUserToken}` },
				variables: { userId: adminUserArgVal },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByAdmin as Array<{
				id: string;
				name: string;
			}>;
			expect(events).toBeDefined();
			expect(events.length).toBeGreaterThanOrEqual(2);

			// Find the two events with same start time
			const sameTimeEvents = events.filter(
				(e) =>
					e.name === "Admin Sort Event A" || e.name === "Admin Sort Event B",
			);
			expect(sameTimeEvents.length).toBe(2);

			// Events with same start time should be sorted by ID
			const firstEvent = sameTimeEvents[0];
			const secondEvent = sameTimeEvents[1];
			assertToBeNonNullish(firstEvent);
			assertToBeNonNullish(secondEvent);
			expect(firstEvent.id.localeCompare(secondEvent.id)).toBeLessThan(0);
		});

		test("should handle recurring event templates in admin orgs", async () => {
			const { userId: adminUserArgVal, authToken: adminUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(adminUserArgVal);

			// Create Org
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Admin Recurring Org ${faker.string.ulid()}`,
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

			// Make user an admin of this org
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: adminUserArgVal,
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
					headers: { authorization: `bearer ${adminUserToken}` },
					variables: {
						input: {
							name: "Admin Recurring Tomorrow Event",
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

			// Query should succeed and may return instances if generated
			const result = await mercuriusClient.query(Query_eventsByAdmin, {
				headers: { authorization: `bearer ${adminUserToken}` },
				variables: { userId: adminUserArgVal },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByAdmin).toBeDefined();
			expect(Array.isArray(result.data?.eventsByAdmin)).toBe(true);
		});
	});

	suite("error handling", () => {
		test("should handle database errors gracefully", async () => {
			const { userId: adminUserArgVal, authToken: adminUserToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(adminUserArgVal);

			// Mock the drizzle client to throw an error
			const spy = vi.spyOn(
				server.drizzleClient.query.organizationMembershipsTable,
				"findMany",
			);
			spy.mockRejectedValueOnce(new Error("Database connection failed"));

			try {
				const result = await mercuriusClient.query(Query_eventsByAdmin, {
					headers: { authorization: `bearer ${adminUserToken}` },
					variables: { userId: adminUserArgVal },
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
