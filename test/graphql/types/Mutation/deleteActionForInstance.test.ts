import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
  DELETE_ACTION_FOR_INSTANCE_MUTATION,
  Mutation_createActionItem,
  Mutation_createActionItemCategory,
  Mutation_createOrganization,
  Mutation_createOrganizationMembership,
  Mutation_createUser,
  Query_signIn,
  Mutation_createEvent,
} from "../documentNodes";

// Sign in as admin to get an authentication token and admin user id.
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
assertToBeNonNullish(authToken);
assertToBeNonNullish(signInResult.data.signIn.user);
const adminUser = signInResult.data.signIn.user;

// Helper to create an organization with a unique name and return its id.
async function createOrganizationAndGetId(): Promise<string> {
  const uniqueName = `Test Org ${faker.string.uuid()}`;
  const result = await mercuriusClient.mutate(Mutation_createOrganization, {
    headers: { authorization: `bearer ${authToken}` },
    variables: {
      input: {
        name: uniqueName,
        countryCode: "us",
      },
    },
  });
  const orgId = result.data?.createOrganization?.id;
  assertToBeNonNullish(orgId);
  return orgId;
}

// Helper to create an action item category
async function createActionItemCategory(
  organizationId: string
): Promise<string> {
  await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
    headers: { authorization: `bearer ${authToken}` },
    variables: {
      input: {
        organizationId,
        memberId: adminUser.id,
        role: "administrator",
      },
    },
  });

  const result = await mercuriusClient.mutate(
    Mutation_createActionItemCategory,
    {
      headers: { authorization: `bearer ${authToken}` },
      variables: {
        input: {
          name: `Test Category ${faker.string.uuid()}`,
          organizationId: organizationId,
          isDisabled: false,
        },
      },
    }
  );

  const categoryId = result.data?.createActionItemCategory?.id;
  assertToBeNonNullish(categoryId);
  return categoryId;
}

// Helper to create an action item
async function createActionItem(
  organizationId: string,
  categoryId: string,
  assigneeId: string
): Promise<string> {
  const result = await mercuriusClient.mutate(Mutation_createActionItem, {
    headers: { authorization: `bearer ${authToken}` },
    variables: {
      input: {
        categoryId: categoryId,
        assigneeId: assigneeId,
        organizationId: organizationId,
        assignedAt: "2025-04-01T00:00:00Z",
      },
    },
  });

  const actionItemId = result.data?.createActionItem?.id;
  assertToBeNonNullish(actionItemId);
  return actionItemId;
}

// Helper to create a user
async function createUser(): Promise<string> {
  const result = await mercuriusClient.mutate(Mutation_createUser, {
    headers: { authorization: `bearer ${authToken}` },
    variables: {
      input: {
        emailAddress: `testuser${faker.string.uuid()}@example.com`,
        isEmailAddressVerified: true,
        name: "Test User",
        password: "password",
        role: "regular",
      },
    },
  });
  const userId = result.data?.createUser?.user?.id;
  assertToBeNonNullish(userId);
  return userId;
}

suite("Mutation field deleteActionForInstance", () => {
  // 1. Unauthenticated: user not logged in.
  suite("when the client is not authenticated", () => {
    test("should return an error with unauthenticated code", async () => {
      const result = await mercuriusClient.mutate(
        DELETE_ACTION_FOR_INSTANCE_MUTATION,
        {
          variables: {
            input: {
              actionId: faker.string.uuid(),
              eventId: faker.string.uuid(),
            },
          },
        }
      );
      expect(result.data?.deleteActionForInstance).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({ code: "unauthenticated" }),
          }),
        ])
      );
    });
  });

  // 2. Invalid arguments.
  suite("when the arguments are invalid", () => {
    test("should return an error with invalid_arguments code", async () => {
      const result = await mercuriusClient.mutate(
        DELETE_ACTION_FOR_INSTANCE_MUTATION,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              actionId: faker.string.uuid(),
              eventId: "",
            },
          },
        }
      );
      expect(result.data?.deleteActionForInstance).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({ code: "invalid_arguments" }),
          }),
        ])
      );
    });
  });

  // 3. Action item does not exist.
  suite("when the specified action item does not exist", () => {
    test("should return an error with arguments_associated_resources_not_found for action item", async () => {
      const result = await mercuriusClient.mutate(
        DELETE_ACTION_FOR_INSTANCE_MUTATION,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              actionId: faker.string.uuid(),
              eventId: faker.string.uuid(),
            },
          },
        }
      );
      expect(result.data?.deleteActionForInstance).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "arguments_associated_resources_not_found",
            }),
          }),
        ])
      );
    });
  });

  // 4. Event instance does not exist.
  suite("when the specified event instance does not exist", () => {
    test("should return an error with arguments_associated_resources_not_found for event instance", async () => {
      const orgId = await createOrganizationAndGetId();
      const categoryId = await createActionItemCategory(orgId);
      const userId = await createUser();
      const actionId = await createActionItem(orgId, categoryId, userId);
      const result = await mercuriusClient.mutate(
        DELETE_ACTION_FOR_INSTANCE_MUTATION,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              actionId: actionId,
              eventId: faker.string.uuid(),
            },
          },
        }
      );
      expect(result.data?.deleteActionForInstance).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "arguments_associated_resources_not_found",
            }),
          }),
        ])
      );
    });
  });

  // 5. Database insert failure.
  suite("when the database insert operation fails", () => {
    test("should return an error with unexpected code", async () => {
      const orgId = await createOrganizationAndGetId();
      const categoryId = await createActionItemCategory(orgId);
      const userId = await createUser();

      // Create a recurring event
      const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
        headers: { authorization: `bearer ${authToken}` },
        variables: {
          input: {
            organizationId: orgId,
            name: "Test Event",
            description: "Test Event Description",
            startAt: "2025-01-01T00:00:00Z",
            endAt: "2025-01-01T01:00:00Z",
            recurrence: {
              frequency: "DAILY",
              interval: 1,
              endDate: "2025-01-02T00:00:00Z",
            },
          },
        },
      });
      assertToBeNonNullish(eventResult.data?.createEvent);
      const eventId = eventResult.data.createEvent.id;
      assertToBeNonNullish(eventId);

      // Get an instance ID
      const instances =
        await server.drizzleClient.query.recurringEventInstancesTable.findMany({
          where: (fields, { eq }) => eq(fields.baseRecurringEventId, eventId),
        });
      if (instances.length === 0) {
        throw new Error("No instances generated for recurring event");
      }
      const instanceId = instances[0]!.id;

      // Create action item
      const actionItemResult = await mercuriusClient.mutate(
        Mutation_createActionItem,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              categoryId: categoryId,
              assigneeId: userId,
              organizationId: orgId,
              recurringEventInstanceId: instanceId,
              assignedAt: "2025-04-01T00:00:00Z",
            },
          },
        }
      );
      const actionId = actionItemResult.data?.createActionItem?.id;
      assertToBeNonNullish(actionId);

      // Mock the insert method to return empty array
      const originalInsert = server.drizzleClient.insert;
      server.drizzleClient.insert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]), // Return empty array to simulate failure
          }),
        }),
      });

      try {
        const result = await mercuriusClient.mutate(
          DELETE_ACTION_FOR_INSTANCE_MUTATION,
          {
            headers: { authorization: `bearer ${authToken}` },
            variables: {
              input: {
                actionId: actionId,
                eventId: instanceId,
              },
            },
          }
        );

        expect(result.data?.deleteActionForInstance).toBeNull();
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              extensions: expect.objectContaining({ code: "unexpected" }),
            }),
          ])
        );
      } finally {
        // Restore original insert method
        server.drizzleClient.insert = originalInsert;
      }
    });
  });

  // 6. Successful deletion.
  suite("when action item is deleted successfully for an instance", () => {
    test("should return a valid action item", async () => {
      const orgId = await createOrganizationAndGetId();
      const categoryId = await createActionItemCategory(orgId);
      const userId = await createUser();
      const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
        headers: { authorization: `bearer ${authToken}` },
        variables: {
          input: {
            organizationId: orgId,
            name: "Test Event",
            description: "Test Event Description",
            startAt: "2025-01-01T00:00:00Z",
            endAt: "2025-01-01T01:00:00Z",
            recurrence: {
              frequency: "DAILY",
              interval: 1,
              endDate: "2025-01-02T00:00:00Z",
            },
          },
        },
      });
      assertToBeNonNullish(eventResult.data?.createEvent);
      const eventId = eventResult.data.createEvent.id;
      assertToBeNonNullish(eventId);

      // Get an instance ID for the recurring event
      const instances =
        await server.drizzleClient.query.recurringEventInstancesTable.findMany({
          where: (fields, { eq }) => eq(fields.baseRecurringEventId, eventId),
        });
      if (instances.length === 0) {
        throw new Error("No instances generated for recurring event");
      }
      const instanceId = instances[0]!.id; // Use the first instance

      const actionItemResult = await mercuriusClient.mutate(
        Mutation_createActionItem,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              categoryId: categoryId,
              assigneeId: userId,
              organizationId: orgId,
              recurringEventInstanceId: instanceId, // Use instance ID instead of template ID
              assignedAt: "2025-04-01T00:00:00Z",
            },
          },
        }
      );
      const actionId = actionItemResult.data?.createActionItem?.id;
      assertToBeNonNullish(actionId);

      const result = await mercuriusClient.mutate(
        DELETE_ACTION_FOR_INSTANCE_MUTATION,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              actionId: actionId,
              eventId: instanceId, // Use instance ID instead of template ID
            },
          },
        }
      );

      expect(result.errors).toBeUndefined();
      expect(result.data?.deleteActionForInstance).toEqual(
        expect.objectContaining({
          id: expect.any(String),
        })
      );
    });
  });
});
