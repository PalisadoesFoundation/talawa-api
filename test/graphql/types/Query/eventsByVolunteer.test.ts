import { faker } from "@faker-js/faker";
import { and, eq, inArray } from "drizzle-orm";
import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin as createRegularUserUsingAdminBase } from "../createRegularUserUsingAdmin";
import {
  Mutation_createEvent,
  Mutation_createEventVolunteer,
  Mutation_createOrganization,
  Mutation_createOrganizationMembership,
  Mutation_updateEventVolunteer,
  Query_eventsByVolunteer,
  Query_eventsByVolunteerWithAttachments,
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

const createdState = {
  userIds: new Set<string>(),
  organizationIds: new Set<string>(),
  eventIds: new Set<string>(),
  eventVolunteerIds: new Set<string>(),
  organizationMembershipKeys: new Set<string>(),
};

const originalMutate = mercuriusClient.mutate.bind(mercuriusClient);

type TrackedMutationResult = {
  data?: {
    createOrganization?: { id?: string | null } | null;
    createEvent?: { id?: string | null } | null;
    createEventVolunteer?: { id?: string | null } | null;
  };
};

async function createRegularUserUsingAdmin(): Promise<{
  userId: string;
  authToken: string;
}> {
  const result = await createRegularUserUsingAdminBase();
  createdState.userIds.add(result.userId);
  return result;
}

beforeEach(() => {
  createdState.userIds.clear();
  createdState.organizationIds.clear();
  createdState.eventIds.clear();
  createdState.eventVolunteerIds.clear();
  createdState.organizationMembershipKeys.clear();

  vi.spyOn(mercuriusClient, "mutate").mockImplementation(async (...args) => {
    const mutation = args[0];
    const options = args[1] as
      | {
          variables?: {
            input?: { memberId?: string; organizationId?: string };
          };
        }
      | undefined;
    const result = await originalMutate(...args);
    const trackedData = (result as TrackedMutationResult).data;

    if (mutation === Mutation_createOrganization) {
      const orgId = trackedData?.createOrganization?.id;
      if (orgId) {
        createdState.organizationIds.add(orgId);
      }
    }

    if (mutation === Mutation_createEvent) {
      const eventId = trackedData?.createEvent?.id;
      if (eventId) {
        createdState.eventIds.add(eventId);
      }
    }

    if (mutation === Mutation_createEventVolunteer) {
      const volunteerId = trackedData?.createEventVolunteer?.id;
      if (volunteerId) {
        createdState.eventVolunteerIds.add(volunteerId);
      }
    }

    if (mutation === Mutation_createOrganizationMembership) {
      const memberId = options?.variables?.input?.memberId;
      const organizationId = options?.variables?.input?.organizationId;
      if (memberId && organizationId) {
        createdState.organizationMembershipKeys.add(
          `${memberId}:${organizationId}`,
        );
      }
    }

    return result;
  });
});

afterEach(async () => {
  const userIds = [...createdState.userIds];
  const organizationIds = [...createdState.organizationIds];
  const eventIds = [...createdState.eventIds];
  const volunteerIds = [...createdState.eventVolunteerIds];
  const membershipKeys = [...createdState.organizationMembershipKeys];

  if (eventIds.length > 0) {
    await server.drizzleClient
      .delete(eventAttachmentsTable)
      .where(inArray(eventAttachmentsTable.eventId, eventIds));
  }

  if (volunteerIds.length > 0) {
    await server.drizzleClient
      .delete(eventVolunteersTable)
      .where(inArray(eventVolunteersTable.id, volunteerIds));
  }

  if (eventIds.length > 0) {
    await server.drizzleClient
      .delete(recurringEventInstancesTable)
      .where(
        inArray(recurringEventInstancesTable.baseRecurringEventId, eventIds),
      );
    await server.drizzleClient
      .delete(eventVolunteersTable)
      .where(inArray(eventVolunteersTable.eventId, eventIds));
    await server.drizzleClient
      .delete(eventsTable)
      .where(inArray(eventsTable.id, eventIds));
  }

  if (organizationIds.length > 0) {
    await server.drizzleClient
      .delete(organizationMembershipsTable)
      .where(
        inArray(organizationMembershipsTable.organizationId, organizationIds),
      );
    await server.drizzleClient
      .delete(organizationsTable)
      .where(inArray(organizationsTable.id, organizationIds));
  }

  if (membershipKeys.length > 0) {
    for (const key of membershipKeys) {
      const [memberId, organizationId] = key.split(":");
      if (memberId && organizationId) {
        await server.drizzleClient
          .delete(organizationMembershipsTable)
          .where(
            and(
              eq(organizationMembershipsTable.memberId, memberId),
              eq(organizationMembershipsTable.organizationId, organizationId),
            ),
          );
      }
    }
  }

  if (userIds.length > 0) {
    await server.drizzleClient
      .delete(eventVolunteersTable)
      .where(inArray(eventVolunteersTable.userId, userIds));
    await server.drizzleClient
      .delete(organizationMembershipsTable)
      .where(inArray(organizationMembershipsTable.memberId, userIds));
    await server.drizzleClient
      .delete(usersTable)
      .where(inArray(usersTable.id, userIds));
  }

  createdState.userIds.clear();
  createdState.organizationIds.clear();
  createdState.eventIds.clear();
  createdState.eventVolunteerIds.clear();
  createdState.organizationMembershipKeys.clear();

  vi.restoreAllMocks();
});

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
      const hasInvalidIdError = result.errors?.some(
        (err) =>
          err.extensions?.code === "invalid_arguments" ||
          err.extensions?.code === "GRAPHQL_VALIDATION_FAILED" ||
          /ID cannot represent|Expected ID|got invalid value|invalid.*uuid/i.test(
            err.message,
          ),
      );
      expect(hasInvalidIdError).toBe(true);
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
              startAt: new Date(
                Date.now() + 24 * 60 * 60 * 1000,
              ).toISOString(),
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
              name: `Recurring Event Series ${faker.string.ulid()}`,
              description: "Test recurring event",
              organizationId: orgId,
              startAt: new Date(
                Date.now() + 24 * 60 * 60 * 1000,
              ).toISOString(),
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
        | Array<{
            id: string;
            name: string;
            baseRecurringEventId?: string | null;
          }>
        | undefined;
      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);

      // Filter to only this series' instances by baseRecurringEventId
      const recurringEvents = events?.filter(
        (e) => e.baseRecurringEventId === eventId,
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
              startAt: new Date(
                Date.now() + 24 * 60 * 60 * 1000,
              ).toISOString(),
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
      assertToBeNonNullish(regularUserId);
      assertToBeNonNullish(regularAuthToken);

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
              startAt: new Date(
                Date.now() + 24 * 60 * 60 * 1000,
              ).toISOString(),
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
      const adminResult = await mercuriusClient.query(
        Query_eventsByVolunteer,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: { userId: adminUserId },
        },
      );
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
      // Use a fresh user to avoid cross-test volunteer accumulation on adminUserId
      const { userId: freshUserId } = await createRegularUserUsingAdmin();
      assertToBeNonNullish(freshUserId);

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
              userId: freshUserId,
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
        variables: { userId: freshUserId },
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

    test("should treat a non-template volunteer pointing to a recurring template event as standalone occurrence (timed event, startAt path)", async () => {
      const { userId: freshUserId } = await createRegularUserUsingAdmin();
      assertToBeNonNullish(freshUserId);

      const createOrgResult = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `Standalone Template Org ${faker.string.ulid()}`,
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

      // Create a timed recurring event (isRecurringEventTemplate=true, startAt is non-null)
      const eventStart = "3026-04-15T10:00:00.000Z";
      const eventEnd = "3026-04-15T11:00:00.000Z";

      const createEventResult = await mercuriusClient.mutate(
        Mutation_createEvent,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: "Timed Recurring Template Event",
              description: "Recurring event for standalone-volunteer branch",
              organizationId: orgId,
              startAt: eventStart,
              endAt: eventEnd,
              recurrence: { frequency: "DAILY", count: 2 },
            },
          },
        },
      );
      const templateEventId = createEventResult.data?.createEvent?.id;
      assertToBeNonNullish(templateEventId);

      // Directly insert a volunteer record with isTemplate=false and no recurringEventInstanceId.
      // This represents the edge case: a non-template volunteer pointing at a recurring template.
      await server.drizzleClient.insert(eventVolunteersTable).values({
        userId: freshUserId,
        eventId: templateEventId,
        isTemplate: false,
        recurringEventInstanceId: null,
        hasAccepted: true,
        creatorId: adminUserId,
      });

      const neighborEventResult = await mercuriusClient.mutate(
        Mutation_createEvent,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: "Neighbor Earlier Timed Event",
              description: "Neighbor event to verify deterministic ordering",
              organizationId: orgId,
              startAt: "3026-04-14T10:00:00.000Z",
              endAt: "3026-04-14T11:00:00.000Z",
            },
          },
        },
      );
      const neighborEventId = neighborEventResult.data?.createEvent?.id;
      assertToBeNonNullish(neighborEventId);

      await server.drizzleClient.insert(eventVolunteersTable).values({
        userId: freshUserId,
        eventId: neighborEventId,
        isTemplate: false,
        recurringEventInstanceId: null,
        hasAccepted: true,
        creatorId: adminUserId,
      });

      const result = await mercuriusClient.query(Query_eventsByVolunteer, {
        headers: { authorization: `bearer ${authToken}` },
        variables: { userId: freshUserId },
      });

      expect(result.errors).toBeUndefined();
      const events = result.data?.eventsByVolunteer as
        | Array<{ id: string; name: string }>
        | undefined;
      assertToBeNonNullish(events);
      const templateIndex = events.findIndex((e) => e.id === templateEventId);
      const neighborIndex = events.findIndex((e) => e.id === neighborEventId);
      expect(templateIndex).toBeGreaterThanOrEqual(0);
      expect(neighborIndex).toBeGreaterThanOrEqual(0);
      expect(neighborIndex).toBeLessThan(templateIndex);
      expect(events[neighborIndex]?.name).toBe("Neighbor Earlier Timed Event");
      expect(events[templateIndex]?.name).toBe(
        "Timed Recurring Template Event",
      );
    });

    test("should treat a non-template volunteer pointing to an all-day recurring template event as standalone occurrence (startDate path)", async () => {
      const { userId: freshUserId } = await createRegularUserUsingAdmin();
      assertToBeNonNullish(freshUserId);

      const createOrgResult = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `AllDay Template Org ${faker.string.ulid()}`,
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

      // Create an all-day recurring event (startAt=null, startDate is set)
      const createEventResult = await mercuriusClient.mutate(
        Mutation_createEvent,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: "AllDay Recurring Template Event",
              description:
                "All-day recurring event for standalone-volunteer branch",
              organizationId: orgId,
              allDay: true,
              startDate: "2030-06-01",
              endDate: "2030-06-02",
              recurrence: { frequency: "DAILY", count: 2 },
            },
          },
        },
      );
      const templateEventId = createEventResult.data?.createEvent?.id;
      assertToBeNonNullish(templateEventId);

      // Directly insert a volunteer record with isTemplate=false and no recurringEventInstanceId.
      // The event has startAt=null and startDate set, exercising the startDate branch.
      await server.drizzleClient.insert(eventVolunteersTable).values({
        userId: freshUserId,
        eventId: templateEventId,
        isTemplate: false,
        recurringEventInstanceId: null,
        hasAccepted: true,
        creatorId: adminUserId,
      });

      const neighborEventResult = await mercuriusClient.mutate(
        Mutation_createEvent,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: "Neighbor Later Timed Event",
              description:
                "Neighbor event to validate startDate-based ordering",
              organizationId: orgId,
              startAt: "2030-06-02T10:00:00.000Z",
              endAt: "2030-06-02T11:00:00.000Z",
            },
          },
        },
      );
      const neighborEventId = neighborEventResult.data?.createEvent?.id;
      assertToBeNonNullish(neighborEventId);

      await server.drizzleClient.insert(eventVolunteersTable).values({
        userId: freshUserId,
        eventId: neighborEventId,
        isTemplate: false,
        recurringEventInstanceId: null,
        hasAccepted: true,
        creatorId: adminUserId,
      });

      const result = await mercuriusClient.query(Query_eventsByVolunteer, {
        headers: { authorization: `bearer ${authToken}` },
        variables: { userId: freshUserId },
      });

      expect(result.errors).toBeUndefined();
      const events = result.data?.eventsByVolunteer as
        | Array<{ id: string; name: string }>
        | undefined;
      assertToBeNonNullish(events);
      const templateIndex = events.findIndex((e) => e.id === templateEventId);
      const neighborIndex = events.findIndex((e) => e.id === neighborEventId);
      expect(templateIndex).toBeGreaterThanOrEqual(0);
      expect(neighborIndex).toBeGreaterThanOrEqual(0);
      expect(templateIndex).toBeLessThan(neighborIndex);
      expect(events[templateIndex]?.name).toBe(
        "AllDay Recurring Template Event",
      );
      expect(events[neighborIndex]?.name).toBe("Neighbor Later Timed Event");
    });

    test("should use startDate when computing sort key for all-day standalone event (line 217-218 startDate branch)", async () => {
      const { userId: freshUserId } = await createRegularUserUsingAdmin();
      assertToBeNonNullish(freshUserId);

      const createOrgResult = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `AllDay Standalone Org ${faker.string.ulid()}`,
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

      // Create an all-day standalone event (no recurrence → isRecurringEventTemplate=false, startAt=null)
      const createEventResult = await mercuriusClient.mutate(
        Mutation_createEvent,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: "AllDay Standalone Event",
              description: "standalone all-day event for startDate branch",
              organizationId: orgId,
              allDay: true,
              startDate: "2028-03-15",
              endDate: "2028-03-16",
            },
          },
        },
      );
      const standaloneEventId = createEventResult.data?.createEvent?.id;
      assertToBeNonNullish(standaloneEventId);

      // Direct insert: isTemplate=false, no recurringEventInstanceId → possiblyStandaloneEventIds
      await server.drizzleClient.insert(eventVolunteersTable).values({
        userId: freshUserId,
        eventId: standaloneEventId,
        isTemplate: false,
        recurringEventInstanceId: null,
        hasAccepted: true,
        creatorId: adminUserId,
      });

      const neighborEventResult = await mercuriusClient.mutate(
        Mutation_createEvent,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: "Neighbor Timed Event",
              description: "Timed neighbor to lock sort behavior",
              organizationId: orgId,
              startAt: "2028-03-16T09:00:00.000Z",
              endAt: "2028-03-16T10:00:00.000Z",
            },
          },
        },
      );
      const neighborEventId = neighborEventResult.data?.createEvent?.id;
      assertToBeNonNullish(neighborEventId);

      await server.drizzleClient.insert(eventVolunteersTable).values({
        userId: freshUserId,
        eventId: neighborEventId,
        isTemplate: false,
        recurringEventInstanceId: null,
        hasAccepted: true,
        creatorId: adminUserId,
      });

      const result = await mercuriusClient.query(Query_eventsByVolunteer, {
        headers: { authorization: `bearer ${authToken}` },
        variables: { userId: freshUserId },
      });

      expect(result.errors).toBeUndefined();
      const events = result.data?.eventsByVolunteer as
        | Array<{ id: string; name: string }>
        | undefined;
      assertToBeNonNullish(events);
      const standaloneIndex = events.findIndex(
        (e) => e.id === standaloneEventId,
      );
      const neighborIndex = events.findIndex((e) => e.id === neighborEventId);
      expect(standaloneIndex).toBeGreaterThanOrEqual(0);
      expect(neighborIndex).toBeGreaterThanOrEqual(0);
      expect(standaloneIndex).toBeLessThan(neighborIndex);
      expect(events[standaloneIndex]?.name).toBe("AllDay Standalone Event");
      expect(events[neighborIndex]?.name).toBe("Neighbor Timed Event");
    });

    test("should use actualStartDate when computing sort key for a specific all-day recurring instance (line 247-248 actualStartDate branch)", async () => {
      const createOrgResult = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `AllDay Specific Instance Org ${faker.string.ulid()}`,
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

      // Create an all-day recurring event with near-future dates so instances get generated
      const createEventResult = await mercuriusClient.mutate(
        Mutation_createEvent,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: "AllDay Specific Instance Event",
              description: "all-day recurring for specific instance test",
              organizationId: orgId,
              allDay: true,
              startDate: "3026-04-01",
              endDate: "3026-04-02",
              recurrence: { frequency: "DAILY", count: 3 },
            },
          },
        },
      );
      const baseEventId = createEventResult.data?.createEvent?.id;
      assertToBeNonNullish(baseEventId);

      // Step 1: admin volunteers ENTIRE_SERIES to trigger instance generation
      const adminVolResult = await mercuriusClient.mutate(
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
      const adminVolId = adminVolResult.data?.createEventVolunteer?.id;
      assertToBeNonNullish(adminVolId);
      await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
        headers: { authorization: `bearer ${authToken}` },
        variables: { id: adminVolId, data: { hasAccepted: true } },
      });

      // Discover the generated all-day instance IDs via query
      const adminQueryResult = await mercuriusClient.query(
        Query_eventsByVolunteer,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: { userId: adminUserId },
        },
      );
      const adminEvents = adminQueryResult.data?.eventsByVolunteer as Array<{
        id: string;
        isGenerated?: boolean | null;
        baseRecurringEventId?: string | null;
      }>;
      assertToBeNonNullish(adminEvents);
      const allDayInstance = adminEvents.find(
        (e) =>
          e.isGenerated === true && e.baseRecurringEventId === baseEventId,
      );
      assertToBeNonNullish(allDayInstance);
      const instanceId = allDayInstance.id;

      // Step 2: fresh user volunteers for that specific instance (THIS_INSTANCE_ONLY)
      const { userId: freshUserId } = await createRegularUserUsingAdmin();
      assertToBeNonNullish(freshUserId);

      const volunteerResult = await mercuriusClient.mutate(
        Mutation_createEventVolunteer,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              userId: freshUserId,
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
      await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
        headers: { authorization: `bearer ${authToken}` },
        variables: { id: volunteerId, data: { hasAccepted: true } },
      });

      // Query: the resolver will use actualStartDate path since allDay instance has actualStartTime=null
      const result = await mercuriusClient.query(Query_eventsByVolunteer, {
        headers: { authorization: `bearer ${authToken}` },
        variables: { userId: freshUserId },
      });

      expect(result.errors).toBeUndefined();
      const events = result.data?.eventsByVolunteer as
        | Array<{ id: string; isGenerated?: boolean | null }>
        | undefined;
      assertToBeNonNullish(events);
      const found = events.find((e) => e.id === instanceId);
      expect(found).toBeDefined();
    });

    test("should use actualStartDate when computing sort key for template all-day instances in windowed fetch (line 295-296 actualStartDate branch)", async () => {
      const { userId: freshUserId } = await createRegularUserUsingAdmin();
      assertToBeNonNullish(freshUserId);

      const createOrgResult = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `AllDay Template Instances Org ${faker.string.ulid()}`,
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

      // Create an all-day recurring event with near-future dates so instances get generated
      const createEventResult = await mercuriusClient.mutate(
        Mutation_createEvent,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: "AllDay Template Instances Event",
              description: "all-day recurring for template instances test",
              organizationId: orgId,
              allDay: true,
              startDate: "3026-05-01",
              endDate: "3026-05-02",
              recurrence: { frequency: "DAILY", count: 2 },
            },
          },
        },
      );
      const baseEventId = createEventResult.data?.createEvent?.id;
      assertToBeNonNullish(baseEventId);

      // Volunteer for ENTIRE_SERIES: resolver will fetch instances via realTemplateIds path,
      // and since instances are all-day (actualStartTime=null), it uses actualStartDate branch
      const volResult = await mercuriusClient.mutate(
        Mutation_createEventVolunteer,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              userId: freshUserId,
              eventId: baseEventId,
              scope: "ENTIRE_SERIES",
            },
          },
        },
      );
      expect(volResult.errors).toBeUndefined();
      const volId = volResult.data?.createEventVolunteer?.id;
      assertToBeNonNullish(volId);
      await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
        headers: { authorization: `bearer ${authToken}` },
        variables: { id: volId, data: { hasAccepted: true } },
      });

      const result = await mercuriusClient.query(Query_eventsByVolunteer, {
        headers: { authorization: `bearer ${authToken}` },
        variables: { userId: freshUserId },
      });

      expect(result.errors).toBeUndefined();
      const events = result.data?.eventsByVolunteer as
        | Array<{
            id: string;
            isGenerated?: boolean | null;
            baseRecurringEventId?: string | null;
          }>
        | undefined;
      assertToBeNonNullish(events);
      // Should have at least the generated all-day instances or base event fallback
      expect(events.length).toBeGreaterThanOrEqual(1);
      // If instances exist, they should be linked to the base event
      const relatedEvents = events.filter(
        (e) => e.baseRecurringEventId === baseEventId || e.id === baseEventId,
      );
      expect(relatedEvents.length).toBeGreaterThanOrEqual(1);
    });

    test("should use startDate when computing sort key for all-day recurring template fallback (line 347-348 startDate branch)", async () => {
      const { userId: freshUserId } = await createRegularUserUsingAdmin();
      assertToBeNonNullish(freshUserId);

      const createOrgResult = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: `AllDay No Instances Org ${faker.string.ulid()}`,
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

      // Create a far-future all-day recurring event (no instances generated yet)
      const createEventResult = await mercuriusClient.mutate(
        Mutation_createEvent,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: "AllDay Far Future Recurring Event",
              description:
                "far future all-day recurring for fallback startDate branch",
              organizationId: orgId,
              allDay: true,
              startDate: "2040-01-01",
              endDate: "2040-01-02",
              recurrence: { frequency: "DAILY", count: 2 },
            },
          },
        },
      );
      const baseEventId = createEventResult.data?.createEvent?.id;
      assertToBeNonNullish(baseEventId);

      // Volunteer ENTIRE_SERIES: no instances exist, so fallback returns base event
      // using info.startDate (branch line 347-348) since allDay event has startAt=null
      const volResult = await mercuriusClient.mutate(
        Mutation_createEventVolunteer,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              userId: freshUserId,
              eventId: baseEventId,
              scope: "ENTIRE_SERIES",
            },
          },
        },
      );
      expect(volResult.errors).toBeUndefined();
      const volId = volResult.data?.createEventVolunteer?.id;
      assertToBeNonNullish(volId);
      await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
        headers: { authorization: `bearer ${authToken}` },
        variables: { id: volId, data: { hasAccepted: true } },
      });

      const result = await mercuriusClient.query(Query_eventsByVolunteer, {
        headers: { authorization: `bearer ${authToken}` },
        variables: { userId: freshUserId },
      });

      expect(result.errors).toBeUndefined();
      const events = result.data?.eventsByVolunteer as
        | Array<{ id: string; name: string }>
        | undefined;
      assertToBeNonNullish(events);
      // Fallback: the base event itself is returned since no instances exist
      const found = events.find((e) => e.id === baseEventId);
      expect(found).toBeDefined();
      expect(found?.name).toBe("AllDay Far Future Recurring Event");
    });

    suite(
      "multi-template fallback scenarios with mixed instance availability",
      () => {
        test("should return instances from one template and base event from template without instances", async () => {
          // Use a fresh user to avoid cross-test volunteer accumulation on adminUserId
          const { userId: freshUserId } = await createRegularUserUsingAdmin();
          assertToBeNonNullish(freshUserId);

          const createOrgResult = await mercuriusClient.mutate(
            Mutation_createOrganization,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: `Multi Template Org ${faker.string.ulid()}`,
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

          // Event A: recent date with instances
          const recentDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
          const recentEndDate = new Date(recentDate);
          recentEndDate.setDate(recentEndDate.getDate() + 1);

          const createEventAResult = await mercuriusClient.mutate(
            Mutation_createEvent,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: "Event A With Instances",
                  description: "Event with instances",
                  organizationId: orgId,
                  startAt: recentDate.toISOString(),
                  endAt: recentEndDate.toISOString(),
                  recurrence: {
                    frequency: "DAILY",
                    count: 3,
                  },
                },
              },
            },
          );
          const eventAId = createEventAResult.data?.createEvent?.id;
          assertToBeNonNullish(eventAId);

          // Event B: far future date without instances
          const futureDate = new Date();
          futureDate.setFullYear(futureDate.getFullYear() + 5);
          const futureEndDate = new Date(futureDate);
          futureEndDate.setDate(futureEndDate.getDate() + 1);

          const createEventBResult = await mercuriusClient.mutate(
            Mutation_createEvent,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: "Event B No Instances",
                  description: "Event without instances",
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
          const eventBId = createEventBResult.data?.createEvent?.id;
          assertToBeNonNullish(eventBId);

          // Volunteer for both entire series
          const volunteerAResult = await mercuriusClient.mutate(
            Mutation_createEventVolunteer,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  userId: freshUserId,
                  eventId: eventAId,
                  scope: "ENTIRE_SERIES",
                },
              },
            },
          );
          expect(volunteerAResult.errors).toBeUndefined();
          const volunteerAId = volunteerAResult.data?.createEventVolunteer?.id;
          assertToBeNonNullish(volunteerAId);

          const volunteerBResult = await mercuriusClient.mutate(
            Mutation_createEventVolunteer,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  userId: freshUserId,
                  eventId: eventBId,
                  scope: "ENTIRE_SERIES",
                },
              },
            },
          );
          expect(volunteerBResult.errors).toBeUndefined();
          const volunteerBId = volunteerBResult.data?.createEventVolunteer?.id;
          assertToBeNonNullish(volunteerBId);

          // Accept both volunteers
          await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              id: volunteerAId,
              data: { hasAccepted: true },
            },
          });

          await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              id: volunteerBId,
              data: { hasAccepted: true },
            },
          });

          const result = await mercuriusClient.query(Query_eventsByVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: { userId: freshUserId },
          });

          expect(result.errors).toBeUndefined();
          const events = result.data?.eventsByVolunteer as
            | Array<{
                id: string;
                name: string;
                baseRecurringEventId: string | null;
              }>
            | undefined;
          assertToBeNonNullish(events);

          // Should have 3 instances from Event A + 1 base event from Event B = 4 total
          expect(events.length).toBeGreaterThanOrEqual(4);

          // Check Event A instances (should be instances, not base event)
          const eventAInstances = events.filter(
            (e) => e.baseRecurringEventId === eventAId,
          );
          expect(eventAInstances.length).toBe(3);
          eventAInstances.forEach((instance) => {
            expect(instance.name).toBe("Event A With Instances");
          });

          // Check Event B fallback (should be base event)
          const eventBBase = events.find(
            (e) => e.id === eventBId && e.baseRecurringEventId === null,
          );
          expect(eventBBase).toBeDefined();
          expect(eventBBase?.name).toBe("Event B No Instances");
        });

        test("should exercise remainingTemplateIds query path with three templates of mixed availability", async () => {
          // Use a fresh user to avoid cross-test volunteer accumulation on adminUserId
          const { userId: freshUserId } = await createRegularUserUsingAdmin();
          assertToBeNonNullish(freshUserId);

          const createOrgResult = await mercuriusClient.mutate(
            Mutation_createOrganization,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: `Remaining IDs Org ${faker.string.ulid()}`,
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

          // Event A: very recent date with instances (will be in windowed fetch)
          const recentDate = new Date(Date.now() + 12 * 60 * 60 * 1000);
          const recentEndDate = new Date(recentDate);
          recentEndDate.setHours(recentEndDate.getHours() + 1);

          const createEventAResult = await mercuriusClient.mutate(
            Mutation_createEvent,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: "Event A Windowed",
                  description: "Event in windowed fetch",
                  organizationId: orgId,
                  startAt: recentDate.toISOString(),
                  endAt: recentEndDate.toISOString(),
                  recurrence: {
                    frequency: "DAILY",
                    count: 2,
                  },
                },
              },
            },
          );
          const eventAId = createEventAResult.data?.createEvent?.id;
          assertToBeNonNullish(eventAId);

          // Event B: far future without instances
          const futureDate = new Date();
          futureDate.setFullYear(futureDate.getFullYear() + 10);
          const futureEndDate = new Date(futureDate);
          futureEndDate.setDate(futureEndDate.getDate() + 1);

          const createEventBResult = await mercuriusClient.mutate(
            Mutation_createEvent,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: "Event B No Instances",
                  description: "Event without instances",
                  organizationId: orgId,
                  startAt: futureDate.toISOString(),
                  endAt: futureEndDate.toISOString(),
                  recurrence: {
                    frequency: "DAILY",
                    count: 2,
                  },
                },
              },
            },
          );
          const eventBId = createEventBResult.data?.createEvent?.id;
          assertToBeNonNullish(eventBId);

          // Event C: slightly later date with instances (may be in remainingTemplateIds query)
          const laterDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
          const laterEndDate = new Date(laterDate);
          laterEndDate.setHours(laterEndDate.getHours() + 1);

          const createEventCResult = await mercuriusClient.mutate(
            Mutation_createEvent,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: "Event C Later Instances",
                  description: "Event with later instances",
                  organizationId: orgId,
                  startAt: laterDate.toISOString(),
                  endAt: laterEndDate.toISOString(),
                  recurrence: {
                    frequency: "DAILY",
                    count: 2,
                  },
                },
              },
            },
          );
          const eventCId = createEventCResult.data?.createEvent?.id;
          assertToBeNonNullish(eventCId);

          // Volunteer for all three entire series
          const volunteerAResult = await mercuriusClient.mutate(
            Mutation_createEventVolunteer,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  userId: freshUserId,
                  eventId: eventAId,
                  scope: "ENTIRE_SERIES",
                },
              },
            },
          );
          expect(volunteerAResult.errors).toBeUndefined();

          const volunteerBResult = await mercuriusClient.mutate(
            Mutation_createEventVolunteer,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  userId: freshUserId,
                  eventId: eventBId,
                  scope: "ENTIRE_SERIES",
                },
              },
            },
          );
          expect(volunteerBResult.errors).toBeUndefined();

          const volunteerCResult = await mercuriusClient.mutate(
            Mutation_createEventVolunteer,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  userId: freshUserId,
                  eventId: eventCId,
                  scope: "ENTIRE_SERIES",
                },
              },
            },
          );
          expect(volunteerCResult.errors).toBeUndefined();

          // Accept all volunteers
          const volunteerAId = volunteerAResult.data?.createEventVolunteer?.id;
          assertToBeNonNullish(volunteerAId);
          await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              id: volunteerAId,
              data: { hasAccepted: true },
            },
          });

          const volunteerBId = volunteerBResult.data?.createEventVolunteer?.id;
          assertToBeNonNullish(volunteerBId);
          await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              id: volunteerBId,
              data: { hasAccepted: true },
            },
          });

          const volunteerCId = volunteerCResult.data?.createEventVolunteer?.id;
          assertToBeNonNullish(volunteerCId);
          await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              id: volunteerCId,
              data: { hasAccepted: true },
            },
          });

          const result = await mercuriusClient.query(Query_eventsByVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: { userId: freshUserId },
          });

          expect(result.errors).toBeUndefined();
          const events = result.data?.eventsByVolunteer as
            | Array<{
                id: string;
                name: string;
                baseRecurringEventId: string | null;
              }>
            | undefined;
          assertToBeNonNullish(events);

          // Should have instances from A (2) + instances from C (2) + base event from B (1) = 5 total minimum
          expect(events.length).toBeGreaterThanOrEqual(5);

          // Check Event A instances
          const eventAInstances = events.filter(
            (e) => e.baseRecurringEventId === eventAId,
          );
          expect(eventAInstances.length).toBe(2);

          // Check Event C instances (tests remainingTemplateIds path)
          const eventCInstances = events.filter(
            (e) => e.baseRecurringEventId === eventCId,
          );
          expect(eventCInstances.length).toBe(2);

          // Check Event B fallback (should be base event, not instance)
          const eventBBase = events.find(
            (e) => e.id === eventBId && e.baseRecurringEventId === null,
          );
          expect(eventBBase).toBeDefined();
          expect(eventBBase?.name).toBe("Event B No Instances");
        });

        test("should return all base events when multiple templates have no instances", async () => {
          // Use a fresh user to avoid cross-test volunteer accumulation on adminUserId
          const { userId: freshUserId } = await createRegularUserUsingAdmin();
          assertToBeNonNullish(freshUserId);

          const createOrgResult = await mercuriusClient.mutate(
            Mutation_createOrganization,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: `All No Instances Org ${faker.string.ulid()}`,
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

          // Create three events all with far future dates (no instances)
          const futureDate1 = new Date();
          futureDate1.setFullYear(futureDate1.getFullYear() + 5);
          const futureEndDate1 = new Date(futureDate1);
          futureEndDate1.setDate(futureEndDate1.getDate() + 1);

          const createEvent1Result = await mercuriusClient.mutate(
            Mutation_createEvent,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: "Future Event 1",
                  description: "Far future event 1",
                  organizationId: orgId,
                  startAt: futureDate1.toISOString(),
                  endAt: futureEndDate1.toISOString(),
                  recurrence: {
                    frequency: "DAILY",
                    count: 3,
                  },
                },
              },
            },
          );
          const event1Id = createEvent1Result.data?.createEvent?.id;
          assertToBeNonNullish(event1Id);

          const futureDate2 = new Date();
          futureDate2.setFullYear(futureDate2.getFullYear() + 6);
          const futureEndDate2 = new Date(futureDate2);
          futureEndDate2.setDate(futureEndDate2.getDate() + 1);

          const createEvent2Result = await mercuriusClient.mutate(
            Mutation_createEvent,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: "Future Event 2",
                  description: "Far future event 2",
                  organizationId: orgId,
                  startAt: futureDate2.toISOString(),
                  endAt: futureEndDate2.toISOString(),
                  recurrence: {
                    frequency: "DAILY",
                    count: 3,
                  },
                },
              },
            },
          );
          const event2Id = createEvent2Result.data?.createEvent?.id;
          assertToBeNonNullish(event2Id);

          const futureDate3 = new Date();
          futureDate3.setFullYear(futureDate3.getFullYear() + 7);
          const futureEndDate3 = new Date(futureDate3);
          futureEndDate3.setDate(futureEndDate3.getDate() + 1);

          const createEvent3Result = await mercuriusClient.mutate(
            Mutation_createEvent,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: "Future Event 3",
                  description: "Far future event 3",
                  organizationId: orgId,
                  startAt: futureDate3.toISOString(),
                  endAt: futureEndDate3.toISOString(),
                  recurrence: {
                    frequency: "DAILY",
                    count: 3,
                  },
                },
              },
            },
          );
          const event3Id = createEvent3Result.data?.createEvent?.id;
          assertToBeNonNullish(event3Id);

          // Volunteer for all three entire series
          const volunteer1Result = await mercuriusClient.mutate(
            Mutation_createEventVolunteer,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  userId: freshUserId,
                  eventId: event1Id,
                  scope: "ENTIRE_SERIES",
                },
              },
            },
          );
          expect(volunteer1Result.errors).toBeUndefined();

          const volunteer2Result = await mercuriusClient.mutate(
            Mutation_createEventVolunteer,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  userId: freshUserId,
                  eventId: event2Id,
                  scope: "ENTIRE_SERIES",
                },
              },
            },
          );
          expect(volunteer2Result.errors).toBeUndefined();

          const volunteer3Result = await mercuriusClient.mutate(
            Mutation_createEventVolunteer,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  userId: freshUserId,
                  eventId: event3Id,
                  scope: "ENTIRE_SERIES",
                },
              },
            },
          );
          expect(volunteer3Result.errors).toBeUndefined();

          // Accept all volunteers
          const volunteer1Id = volunteer1Result.data?.createEventVolunteer?.id;
          assertToBeNonNullish(volunteer1Id);
          await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              id: volunteer1Id,
              data: { hasAccepted: true },
            },
          });

          const volunteer2Id = volunteer2Result.data?.createEventVolunteer?.id;
          assertToBeNonNullish(volunteer2Id);
          await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              id: volunteer2Id,
              data: { hasAccepted: true },
            },
          });

          const volunteer3Id = volunteer3Result.data?.createEventVolunteer?.id;
          assertToBeNonNullish(volunteer3Id);
          await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              id: volunteer3Id,
              data: { hasAccepted: true },
            },
          });

          const result = await mercuriusClient.query(Query_eventsByVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: { userId: freshUserId },
          });

          expect(result.errors).toBeUndefined();
          const events = result.data?.eventsByVolunteer as
            | Array<{
                id: string;
                name: string;
                baseRecurringEventId: string | null;
              }>
            | undefined;
          assertToBeNonNullish(events);

          // Should have exactly 3 base events (all fallback since no instances)
          // With a fresh user, there are no other volunteers to contaminate the result
          expect(events.length).toBe(3);

          // Verify all three base events are present
          const event1Base = events.find((e) => e.id === event1Id);
          expect(event1Base).toBeDefined();
          expect(event1Base?.name).toBe("Future Event 1");
          expect(event1Base?.baseRecurringEventId).toBeNull();

          const event2Base = events.find((e) => e.id === event2Id);
          expect(event2Base).toBeDefined();
          expect(event2Base?.name).toBe("Future Event 2");
          expect(event2Base?.baseRecurringEventId).toBeNull();

          const event3Base = events.find((e) => e.id === event3Id);
          expect(event3Base).toBeDefined();
          expect(event3Base?.name).toBe("Future Event 3");
          expect(event3Base?.baseRecurringEventId).toBeNull();
        });

        test("should verify templatesWithInstances correctly populated when some templates found in windowed fetch and others checked via remainingTemplateIds", async () => {
          // Use a fresh user to avoid cross-test volunteer accumulation on adminUserId
          const { userId: freshUserId } = await createRegularUserUsingAdmin();
          assertToBeNonNullish(freshUserId);

          const createOrgResult = await mercuriusClient.mutate(
            Mutation_createOrganization,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: `Complex Fallback Org ${faker.string.ulid()}`,
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

          // Event 1: Very soon with instances (will be in windowed fetch)
          const soon1Date = new Date(Date.now() + 6 * 60 * 60 * 1000);
          const soon1EndDate = new Date(soon1Date);
          soon1EndDate.setHours(soon1EndDate.getHours() + 1);

          const createEvent1Result = await mercuriusClient.mutate(
            Mutation_createEvent,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: "Event 1 Soon",
                  description: "Event with instances soon",
                  organizationId: orgId,
                  startAt: soon1Date.toISOString(),
                  endAt: soon1EndDate.toISOString(),
                  recurrence: {
                    frequency: "DAILY",
                    count: 2,
                  },
                },
              },
            },
          );
          const event1Id = createEvent1Result.data?.createEvent?.id;
          assertToBeNonNullish(event1Id);

          // Event 2: Also soon with instances (will be in windowed fetch)
          const soon2Date = new Date(Date.now() + 8 * 60 * 60 * 1000);
          const soon2EndDate = new Date(soon2Date);
          soon2EndDate.setHours(soon2EndDate.getHours() + 1);

          const createEvent2Result = await mercuriusClient.mutate(
            Mutation_createEvent,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: "Event 2 Soon",
                  description: "Event with instances soon",
                  organizationId: orgId,
                  startAt: soon2Date.toISOString(),
                  endAt: soon2EndDate.toISOString(),
                  recurrence: {
                    frequency: "DAILY",
                    count: 2,
                  },
                },
              },
            },
          );
          const event2Id = createEvent2Result.data?.createEvent?.id;
          assertToBeNonNullish(event2Id);

          // Event 3: Later with instances (may be checked via remainingTemplateIds if window is small)
          const laterDate = new Date(Date.now() + 72 * 60 * 60 * 1000);
          const laterEndDate = new Date(laterDate);
          laterEndDate.setHours(laterEndDate.getHours() + 1);

          const createEvent3Result = await mercuriusClient.mutate(
            Mutation_createEvent,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: "Event 3 Later",
                  description: "Event with later instances",
                  organizationId: orgId,
                  startAt: laterDate.toISOString(),
                  endAt: laterEndDate.toISOString(),
                  recurrence: {
                    frequency: "DAILY",
                    count: 2,
                  },
                },
              },
            },
          );
          const event3Id = createEvent3Result.data?.createEvent?.id;
          assertToBeNonNullish(event3Id);

          // Event 4: Far future with no instances (will need fallback)
          const farFutureDate = new Date();
          farFutureDate.setFullYear(farFutureDate.getFullYear() + 8);
          const farFutureEndDate = new Date(farFutureDate);
          farFutureEndDate.setDate(farFutureEndDate.getDate() + 1);

          const createEvent4Result = await mercuriusClient.mutate(
            Mutation_createEvent,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  name: "Event 4 No Instances",
                  description: "Event without instances",
                  organizationId: orgId,
                  startAt: farFutureDate.toISOString(),
                  endAt: farFutureEndDate.toISOString(),
                  recurrence: {
                    frequency: "DAILY",
                    count: 2,
                  },
                },
              },
            },
          );
          const event4Id = createEvent4Result.data?.createEvent?.id;
          assertToBeNonNullish(event4Id);

          // Volunteer for all four entire series
          const volunteer1Result = await mercuriusClient.mutate(
            Mutation_createEventVolunteer,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  userId: freshUserId,
                  eventId: event1Id,
                  scope: "ENTIRE_SERIES",
                },
              },
            },
          );
          expect(volunteer1Result.errors).toBeUndefined();

          const volunteer2Result = await mercuriusClient.mutate(
            Mutation_createEventVolunteer,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  userId: freshUserId,
                  eventId: event2Id,
                  scope: "ENTIRE_SERIES",
                },
              },
            },
          );
          expect(volunteer2Result.errors).toBeUndefined();

          const volunteer3Result = await mercuriusClient.mutate(
            Mutation_createEventVolunteer,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  userId: freshUserId,
                  eventId: event3Id,
                  scope: "ENTIRE_SERIES",
                },
              },
            },
          );
          expect(volunteer3Result.errors).toBeUndefined();

          const volunteer4Result = await mercuriusClient.mutate(
            Mutation_createEventVolunteer,
            {
              headers: { authorization: `bearer ${authToken}` },
              variables: {
                input: {
                  userId: freshUserId,
                  eventId: event4Id,
                  scope: "ENTIRE_SERIES",
                },
              },
            },
          );
          expect(volunteer4Result.errors).toBeUndefined();

          // Accept all volunteers
          const volunteer1Id = volunteer1Result.data?.createEventVolunteer?.id;
          assertToBeNonNullish(volunteer1Id);
          await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              id: volunteer1Id,
              data: { hasAccepted: true },
            },
          });

          const volunteer2Id = volunteer2Result.data?.createEventVolunteer?.id;
          assertToBeNonNullish(volunteer2Id);
          await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              id: volunteer2Id,
              data: { hasAccepted: true },
            },
          });

          const volunteer3Id = volunteer3Result.data?.createEventVolunteer?.id;
          assertToBeNonNullish(volunteer3Id);
          await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              id: volunteer3Id,
              data: { hasAccepted: true },
            },
          });

          const volunteer4Id = volunteer4Result.data?.createEventVolunteer?.id;
          assertToBeNonNullish(volunteer4Id);
          await mercuriusClient.mutate(Mutation_updateEventVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              id: volunteer4Id,
              data: { hasAccepted: true },
            },
          });

          const result = await mercuriusClient.query(Query_eventsByVolunteer, {
            headers: { authorization: `bearer ${authToken}` },
            variables: { userId: freshUserId },
          });

          expect(result.errors).toBeUndefined();
          const events = result.data?.eventsByVolunteer as
            | Array<{
                id: string;
                name: string;
                baseRecurringEventId: string | null;
              }>
            | undefined;
          assertToBeNonNullish(events);

          // Should have instances from events 1, 2, 3 and base event from 4
          // Event 1: 2 instances
          const event1Instances = events.filter(
            (e) => e.baseRecurringEventId === event1Id,
          );
          expect(event1Instances.length).toBe(2);

          // Event 2: 2 instances
          const event2Instances = events.filter(
            (e) => e.baseRecurringEventId === event2Id,
          );
          expect(event2Instances.length).toBe(2);

          // Event 3: 2 instances (tests remainingTemplateIds path if not in window)
          const event3Instances = events.filter(
            (e) => e.baseRecurringEventId === event3Id,
          );
          expect(event3Instances.length).toBe(2);

          // Event 4: should have base event fallback (no instances)
          const event4Base = events.find(
            (e) => e.id === event4Id && e.baseRecurringEventId === null,
          );
          expect(event4Base).toBeDefined();
          expect(event4Base?.name).toBe("Event 4 No Instances");

          // Verify Event 4 does NOT also have instances
          const event4Instances = events.filter(
            (e) => e.baseRecurringEventId === event4Id,
          );
          expect(event4Instances.length).toBe(0);
        });
      },
    );
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
      const limitResult = await mercuriusClient.query(
        Query_eventsByVolunteer,
        {
          headers: { authorization: `bearer ${userToken}` },
          variables: { userId, limit: 2 },
        },
      );
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
              startAt: new Date(
                Date.now() + 24 * 60 * 60 * 1000,
              ).toISOString(),
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
        objectName: "test-object-name",
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

      // Verify we can retrieve attachment details
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
