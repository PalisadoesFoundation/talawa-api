import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { initGraphQLTada } from "gql.tada";
import { expect, suite, test, vi } from "vitest";
import { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

// Inline query and mutation definitions to avoid coverage issues
const Query_signIn = gql(`query Query_signIn($input: QuerySignInInput!) {
    signIn(input: $input) {
        authenticationToken
        refreshToken
        user {
            addressLine1
            addressLine2
            birthDate
            city
            countryCode
            createdAt
            description
            educationGrade
            emailAddress
            employmentStatus
            homePhoneNumber
            id
            isEmailAddressVerified
            maritalStatus
            mobilePhoneNumber
            name
            natalSex
            postalCode
            role
            state
            workPhoneNumber
        }
    }
}`);

const Mutation_createOrganization =
	gql(`mutation Mutation_createOrganization($input: MutationCreateOrganizationInput!) {
    createOrganization(input: $input) {
      id
      name
      countryCode
      isUserRegistrationRequired
    }
  }`);

const Mutation_createOrganizationMembership =
	gql(`mutation Mutation_createOrganizationMembership($input: MutationCreateOrganizationMembershipInput!) {
    createOrganizationMembership(input: $input) {
      id
    }
  }`);

const Mutation_createEvent =
	gql(`mutation Mutation_createEvent($input: MutationCreateEventInput!) {
    createEvent(input: $input) {
        id
        name
        description
        startAt
        endAt
        createdAt
        creator{
            id
            name
        }
        organization {
            id
            countryCode
        }
    }
}`);

const Mutation_createEventVolunteer = gql(`
  mutation Mutation_createEventVolunteer($input: EventVolunteerInput!) {
    createEventVolunteer(data: $input) {
      id
      hasAccepted
      isPublic
      hoursVolunteered
      user {
        id
      }
      event {
        id
      }
    }
  }
`);

const Mutation_updateEventVolunteer = gql(`
  mutation Mutation_updateEventVolunteer($id: ID!, $data: UpdateEventVolunteerInput) {
    updateEventVolunteer(id: $id, data: $data) {
      id
      hasAccepted
      isPublic
      hoursVolunteered
      user {
        id
        name
      }
      event {
        id
        name
      }
      creator {
        id
        name
      }
      updater {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`);

const Query_eventsByVolunteer = gql(`
query Query_eventsByVolunteer($userId: ID!, $limit: Int, $offset: Int) {
eventsByVolunteer(userId: $userId, limit: $limit, offset: $offset) {
id
name
description
startAt
endAt
location
allDay
isPublic
isRegisterable
isInviteOnly
isGenerated
baseRecurringEventId
organization {
id
name
}
}
}
`);

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

suite("Query field eventsByVolunteer", () => {
	suite("when input validation fails", () => {
		test("should return an error with invalid_arguments code when userId is not a valid UUID", async () => {
			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					userId: "invalid-uuid",
				},
			});
			expect(result.data?.eventsByVolunteer).toBeUndefined();
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

		test("should return an error when offset is greater than 10,000", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					userId,
					offset: 10_001,
				},
			});
			expect(result.data?.eventsByVolunteer).toBeUndefined();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["offset"],
								}),
							]),
						}),
					}),
				]),
			);
		});
	});

	suite("when user is not authenticated", () => {
		test("should return an error with unauthenticated code when no token provided", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				variables: { userId },
			});
			expect(result.data?.eventsByVolunteer).toBeUndefined();
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

		test("should return an error with unauthenticated code when user is deleted", async () => {
			const { authToken: userAuthToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userAuthToken);
			assertToBeNonNullish(userId);

			// Delete the user from the database
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${userAuthToken}` },
				variables: { userId },
			});

			expect(result.data?.eventsByVolunteer).toBeUndefined();
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
		test("should allow querying own volunteer events", async () => {
			const { authToken: userToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId },
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByVolunteer).toBeDefined();
		});

		test("should not allow querying other user's volunteer events as regular user", async () => {
			const { authToken: userToken } = await createRegularUserUsingAdmin();
			const { userId: otherUserId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(otherUserId);

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId: otherUserId },
			});
			expect(result.data?.eventsByVolunteer).toBeUndefined();
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

		test("should allow admin to query any user's volunteer events", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId },
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByVolunteer).toBeDefined();
		});
	});

	suite("when userId does not match any user", () => {
		test("should return an error with arguments_associated_resources_not_found code", async () => {
			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					userId: faker.string.uuid(),
				},
			});
			expect(result.data?.eventsByVolunteer).toBeUndefined();
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

	suite("when the user has been deleted", () => {
		test("should return specific error when target user is not found", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Delete the user to simulate "not found"
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					userId: userId,
				},
			});

			expect(result.data?.eventsByVolunteer).toBeUndefined();
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

	suite("when getting events by volunteer", () => {
		test("should return empty array when user has not volunteered for any events", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId },
			});
			expect(result.errors).toBeUndefined();
			expect(result.data?.eventsByVolunteer).toEqual([]);
		});

		test("should return events user is volunteering for", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Volunteer Test Org ${faker.string.ulid()}`,
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
							name: "Volunteer Test Event",
							description: "Event for volunteer testing",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Admin volunteers for their own event
			const volunteerResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteer,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							userId: adminUserId,
							eventId,
						},
					},
				},
			);
			expect(volunteerResult.errors).toBeUndefined();
			const volunteerId = volunteerResult.data?.createEventVolunteer?.id;
			assertToBeNonNullish(volunteerId);

			// Accept the volunteer invitation
			const updateResult = await mercuriusClient.mutate(
				Mutation_updateEventVolunteer,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: volunteerId,
						data: {
							hasAccepted: true,
						},
					},
				},
			);
			expect(updateResult.errors).toBeUndefined();

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId: adminUserId },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByVolunteer as
				| Array<{ id: string; name: string }>
				| undefined;
			expect(events).toBeDefined();
			expect(Array.isArray(events)).toBe(true);

			const testEvent = events?.find((e) => e.id === eventId);
			expect(testEvent).toBeDefined();
			expect(testEvent).toMatchObject({
				id: eventId,
				name: "Volunteer Test Event",
			});
		});

		test("should return all instances when volunteering for an entire recurring event series", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Recurring Org ${faker.string.ulid()}`,
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
							name: "Recurring Event Series",
							description: "Test recurring event",
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
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			// Admin volunteers for the entire series
			const volunteerResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteer,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							userId: adminUserId,
							eventId,
							scope: "ENTIRE_SERIES",
						},
					},
				},
			);
			expect(volunteerResult.errors).toBeUndefined();
			const volunteerId = volunteerResult.data?.createEventVolunteer?.id;
			assertToBeNonNullish(volunteerId);

			// Accept the volunteer invitation
			const updateResult = await mercuriusClient.mutate(
				Mutation_updateEventVolunteer,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: volunteerId,
						data: {
							hasAccepted: true,
						},
					},
				},
			);
			expect(updateResult.errors).toBeUndefined();

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId: adminUserId },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByVolunteer as
				| Array<{ id: string; name: string }>
				| undefined;
			expect(events).toBeDefined();
			expect(Array.isArray(events)).toBe(true);

			// Should return multiple instances (at least 3 generated ones)
			// Filter for our specific event name in case other tests run properly
			const recurringEvents = events?.filter(
				(e) => e.name === "Recurring Event Series",
			);
			expect(recurringEvents?.length).toBe(3);
		});

		test("should return specific instance when volunteering for a single instance", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Recurring Instance Org ${faker.string.ulid()}`,
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
							name: "Recurring Instance Event",
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
				isGenerated?: boolean | null;
				baseRecurringEventId?: string | null;
			}>;
			assertToBeNonNullish(adminEvents);
			const instance = adminEvents.find(
				(e) =>
					e.name === "Recurring Instance Event" &&
					e.isGenerated === true &&
					e.baseRecurringEventId === baseEventId,
			);
			assertToBeNonNullish(instance);
			const instanceId = instance.id;

			// Step 2: proper regular user volunteers for THAT specific instance
			const { userId: regularUserId, authToken: regularAuthToken } =
				await createRegularUserUsingAdmin();

			// Make test user an org member so they can volunteer for the non-public event
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						memberId: regularUserId,
						organizationId: orgId,
						role: "regular",
					},
				},
			});

			const volunteerResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteer,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							userId: regularUserId,
							eventId: baseEventId,
							recurringEventInstanceId: instanceId,
							scope: "THIS_INSTANCE_ONLY",
						},
					},
				},
			);
			expect(volunteerResult.errors).toBeUndefined();
			const volunteerId = volunteerResult.data?.createEventVolunteer?.id;
			assertToBeNonNullish(volunteerId);

			// Accept
			await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: volunteerId,
					data: { hasAccepted: true },
				},
			});

			// Step 3: Query
			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${regularAuthToken}` },
				variables: { userId: regularUserId },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByVolunteer as Array<{
				id: string;
				name: string;
			}>;
			assertToBeNonNullish(events);

			// Should return EXACTLY ONE instance
			expect(events.length).toBe(1);
			const event = events[0];
			assertToBeNonNullish(event);
			expect(event.id).toBe(instanceId);
			expect(event.name).toBe("Recurring Instance Event");
		});

		test("should exclude cancelled specific instances", async () => {
			const { authToken: userToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(userId);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Cancelled Instance Org ${faker.string.ulid()}`,
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

			// Create base event
			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Base Event for Cancelled Instance",
							description: "Test event",
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

			// Flatten instances to get IDs
			const volunteerRes = await mercuriusClient.mutate(
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
			const adminVolunteerId = volunteerRes.data?.createEventVolunteer?.id;
			assertToBeNonNullish(adminVolunteerId);

			// Accept the volunteer request for admin so it shows up in queries
			await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: adminVolunteerId,
					data: { hasAccepted: true },
				},
			});

			// Get instances via admin query to find an ID
			const adminResult = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId: adminUserId },
			});
			const adminEvents = adminResult.data?.eventsByVolunteer;
			assertToBeNonNullish(adminEvents);
			const instance = adminEvents.find(
				(e) =>
					e.name === "Base Event for Cancelled Instance" &&
					e.isGenerated === true &&
					e.baseRecurringEventId === baseEventId,
			);
			assertToBeNonNullish(instance);
			const instanceId = instance.id;

			// Cancel this instance directly via DB or if there's a mutation (using DB for speed/directness if possible, or assume mutation exists)
			// We'll use DB direct update since we have access
			await server.drizzleClient
				.update(recurringEventInstancesTable)
				.set({ isCancelled: true })
				.where(eq(recurringEventInstancesTable.id, instanceId));

			// Volunteer for this specific cancelled instance.
			// The query eventsByVolunteer should filter it out even if the user has accepted it.

			const volunteerResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteer,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							userId: userId,
							eventId: baseEventId,
							recurringEventInstanceId: instanceId,
							scope: "THIS_INSTANCE_ONLY",
						},
					},
				},
			);
			const volunteerId = volunteerResult.data?.createEventVolunteer?.id;
			assertToBeNonNullish(volunteerId);

			await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: volunteerId,
					data: { hasAccepted: true },
				},
			});

			// Query events for user
			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByVolunteer;
			assertToBeNonNullish(events);
			// Should NOT contain the cancelled instance
			const found = events.find((e) => e.id === instanceId);
			expect(found).toBeUndefined();
		});

		test("should return base event for recurring series with no material instances (future event)", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Future Org ${faker.string.ulid()}`,
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

			const futureDate = new Date();
			futureDate.setFullYear(futureDate.getFullYear() + 5);
			const futureEndDate = new Date(futureDate);
			futureEndDate.setDate(futureEndDate.getDate() + 1);

			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Future Recurring Event",
							description: "Test future recurring",
							organizationId: orgId,
							startAt: futureDate.toISOString(),
							endAt: futureEndDate.toISOString(),
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

			const volunteerResult = await mercuriusClient.mutate(
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
			expect(volunteerResult.errors).toBeUndefined();
			const volunteerId = volunteerResult.data?.createEventVolunteer?.id;
			assertToBeNonNullish(volunteerId);

			await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: volunteerId,
					data: { hasAccepted: true },
				},
			});

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { userId: adminUserId },
			});

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByVolunteer as
				| Array<{ id: string; name: string }>
				| undefined;
			expect(events).toBeDefined();
			// Should return the base event since no instances are generated for far future
			const futureEvent = events?.find((e) => e.id === baseEventId);
			expect(futureEvent).toBeDefined();
			expect(futureEvent?.name).toBe("Future Recurring Event");
		});
	});

	suite("error handling", () => {
		test("should handle database errors gracefully", async () => {
			const { userId, authToken: userToken } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);
			assertToBeNonNullish(userToken);

			// Mock the drizzle client to throw an error
			const spy = vi.spyOn(
				server.drizzleClient.query.eventVolunteersTable,
				"findMany",
			);
			spy.mockRejectedValueOnce(new Error("Database connection failed"));

			try {
				const result = await mercuriusClient.query(Query_eventsByVolunteer, {
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

	suite("pagination", () => {
		test("should return error when limit is negative", async () => {
			const { authToken: userToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId, limit: -1 },
			});
			expect(result.data?.eventsByVolunteer).toBeUndefined();
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

		test("should return error when offset is negative", async () => {
			const { authToken: userToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId, offset: -1 },
			});
			expect(result.data?.eventsByVolunteer).toBeUndefined();
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

		test("should return error when limit exceeds max", async () => {
			const { authToken: userToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId, limit: 101 },
			});
			expect(result.data?.eventsByVolunteer).toBeUndefined();
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

		test("should paginate results correctly", async () => {
			const { authToken: userToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(userId);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Pagination Org ${faker.string.ulid()}`,
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

			// Create 3 events
			const eventIds: string[] = [];
			for (let i = 0; i < 3; i++) {
				const createEventResult: {
					data?: { createEvent?: { id: string | null } | null } | null;
				} = await mercuriusClient.mutate(Mutation_createEvent, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Paged Event ${i}`,
							description: "Event for pagination testing",
							organizationId: orgId,
							startAt: new Date(
								Date.now() + (i + 1) * 24 * 60 * 60 * 1000,
							).toISOString(), // Staggered start times
							endAt: new Date(
								Date.now() + (i + 1) * 25 * 60 * 60 * 1000,
							).toISOString(),
						},
					},
				});
				const eventId = createEventResult.data?.createEvent?.id;
				assertToBeNonNullish(eventId);
				eventIds.push(eventId);

				// Volunteer
				const volunteerResult: {
					data?: {
						createEventVolunteer?: { id: string | null } | null;
					} | null;
				} = await mercuriusClient.mutate(Mutation_createEventVolunteer, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							userId: userId,
							eventId: eventId,
						},
					},
				});
				const volunteerId = volunteerResult.data?.createEventVolunteer?.id;
				assertToBeNonNullish(volunteerId);

				await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						id: volunteerId,
						data: { hasAccepted: true },
					},
				});
			}

			// Test limit
			const limitResult = await mercuriusClient.query(Query_eventsByVolunteer, {
				headers: { authorization: `bearer ${userToken}` },
				variables: { userId, limit: 2 },
			});
			const limitEvents = limitResult.data?.eventsByVolunteer;
			assertToBeNonNullish(limitEvents);
			expect(limitEvents.length).toBe(2);
			// Should be first 2 events (sorted by start time)
			assertToBeNonNullish(limitEvents[0]);
			assertToBeNonNullish(limitEvents[1]);
			expect(limitEvents[0].id).toBe(eventIds[0]);
			expect(limitEvents[1].id).toBe(eventIds[1]);

			// Test offset
			const offsetResult = await mercuriusClient.query(
				Query_eventsByVolunteer,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: { userId, limit: 2, offset: 1 },
				},
			);
			const offsetEvents = offsetResult.data?.eventsByVolunteer;
			assertToBeNonNullish(offsetEvents);
			expect(offsetEvents.length).toBe(2);
			// Should be event 1 and 2
			assertToBeNonNullish(offsetEvents[0]);
			assertToBeNonNullish(offsetEvents[1]);
			expect(offsetEvents[0].id).toBe(eventIds[1]);
			expect(offsetEvents[1].id).toBe(eventIds[2]);
		});
	});

	suite("when event has attachments", () => {
		test("should return event with attachments", async () => {
			const { authToken: userToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(userId);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Attachment Org ${faker.string.ulid()}`,
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
							name: "Event with Attachment",
							description: "Event with attachment",
							organizationId: orgId,
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
							endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
						},
					},
				},
			);
			const eventId = createEventResult.data?.createEvent?.id;
			assertToBeNonNullish(eventId);

			await server.drizzleClient.insert(eventAttachmentsTable).values({
				eventId: eventId,
				name: "Test Attachment",
				mimeType: "image/jpeg",
			});

			// Volunteer for event
			const volunteerResult = await mercuriusClient.mutate(
				Mutation_createEventVolunteer,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							userId: userId,
							eventId: eventId,
						},
					},
				},
			);
			const volunteerId = volunteerResult.data?.createEventVolunteer?.id;
			assertToBeNonNullish(volunteerId);

			await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					id: volunteerId,
					data: { hasAccepted: true },
				},
			});

			// Local query to fetch attachments
			// Verify we can retrieve attachment details
			const Query_eventsByVolunteerWithAttachments = gql(`
				query eventsByVolunteer($userId: ID!) {
					eventsByVolunteer(userId: $userId) {
						id
						name
						attachments {
							mimeType
							url
						}
					}
				}
			`);

			const result = await mercuriusClient.query(
				Query_eventsByVolunteerWithAttachments,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: { userId },
				},
			);

			expect(result.errors).toBeUndefined();
			const events = result.data?.eventsByVolunteer;
			assertToBeNonNullish(events);
			const event = events.find((e) => e.id === eventId);
			assertToBeNonNullish(event);
			expect(event.attachments).toBeDefined();
			expect(event.attachments?.length).toBe(1);
			expect(event.attachments?.[0]?.mimeType).toBe("image/jpeg");
		});
	});
});
