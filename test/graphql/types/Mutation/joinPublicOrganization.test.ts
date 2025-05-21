import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";
import {
  organizationMembershipsTable,
  organizationsTable,
  usersTable,
} from "~/src/drizzle/schema";
import type {
  TalawaGraphQLFormattedError,
  UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
  Mutation_createOrganization,
  Mutation_deleteOrganization,
  Mutation_joinPublicOrganization,
  Query_signIn,
} from "../documentNodes";

/**
 * Helper function to get admin auth token with proper error handling
 */
let cachedAdminToken: string | null = null;
let cachedAdminId: string | null = null;
async function getAdminAuthTokenAndId(): Promise<{
  cachedAdminToken: string;
  cachedAdminId: string;
}> {
  if (cachedAdminToken && cachedAdminId) {
    return { cachedAdminToken, cachedAdminId };
  }

  try {
    if (
      !server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ||
      !server.envConfig.API_ADMINISTRATOR_USER_PASSWORD
    ) {
      throw new Error("Admin credentials are missing in environment configuration");
    }
    const adminSignInResult = await mercuriusClient.query(Query_signIn, {
      variables: {
        input: {
          emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
          password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
        },
      },
    });

    if (adminSignInResult.errors) {
      throw new Error(
        `Admin authentication failed: ${adminSignInResult.errors[0]?.message || "Unknown error"}`
      );
    }
    if (!adminSignInResult.data?.signIn?.authenticationToken) {
      throw new Error("Admin authentication succeeded but no token was returned");
    }
    if (!adminSignInResult.data?.signIn?.user?.id) {
      throw new Error("Admin authentication succeeded but no user id was returned");
    }
    cachedAdminToken = adminSignInResult.data.signIn.authenticationToken;
    cachedAdminId = adminSignInResult.data.signIn.user.id;
    return { cachedAdminToken, cachedAdminId };
  } catch (error) {
    throw new Error(
      `Failed to get admin authentication token: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

interface TestOrganization {
  orgId: string;
  cleanup: () => Promise<void>;
}

async function createTestOrganization(
  userRegistrationRequired = false
): Promise<TestOrganization> {
  const { cachedAdminToken: adminAuthToken } = await getAdminAuthTokenAndId();

  const createOrgResult = await mercuriusClient.mutate(
    Mutation_createOrganization,
    {
      headers: {
        authorization: `bearer ${adminAuthToken}`,
      },
      variables: {
        input: {
          name: `Org ${faker.string.uuid()}`,
          countryCode: "us",
        },
      },
    },
  );

  if (!createOrgResult.data || !createOrgResult.data.createOrganization) {
    throw new Error(
      `Failed to create test organization: ${
        createOrgResult.errors?.[0]?.message || "Unknown error"
      }`
    );
  }

  assertToBeNonNullish(createOrgResult.data);
  assertToBeNonNullish(createOrgResult.data.createOrganization);
  const orgId = createOrgResult.data.createOrganization.id;

  if (userRegistrationRequired) {
    await server.drizzleClient
      .update(organizationsTable)
      .set({ userRegistrationRequired: true })
      .where(eq(organizationsTable.id, orgId))
      .execute();
  }

  return {
    orgId,
    cleanup: async () => {
      const errors: Error[] = [];
      try {
        await mercuriusClient.mutate(Mutation_deleteOrganization, {
          headers: { authorization: `bearer ${adminAuthToken}` },
          variables: { input: { id: orgId } },
        });
      } catch (error) {
        errors.push(error as Error);
        console.error("Failed to delete organization:", error);
      }
      if (errors.length > 0) {
        throw new AggregateError(errors, "One or more cleanup steps failed");
      }
    },
  };
}

suite("Mutation joinPublicOrganization", () => {
  suite("Authentication", () => {
    const testCleanupFunctions: Array<() => Promise<void>> = [];

    afterEach(async () => {
      for (const cleanup of testCleanupFunctions.reverse()) {
        try {
          await cleanup();
        } catch (error) {
          console.error("Cleanup failed:", error);
        }
      }
      testCleanupFunctions.length = 0;
    });

    test("Returns an error when the user is unauthenticated", async () => {
      const organization = await createTestOrganization();
      testCleanupFunctions.push(organization.cleanup);

      const result = await mercuriusClient.mutate(
        Mutation_joinPublicOrganization,
        {
          variables: {
            input: {
              organizationId: organization.orgId,
            },
          },
        },
      );

      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual(
        expect.arrayContaining<TalawaGraphQLFormattedError>([
          expect.objectContaining<TalawaGraphQLFormattedError>({
            extensions: expect.objectContaining<UnauthenticatedExtensions>({
              code: "unauthenticated",
            }),
            message: expect.any(String),
            path: ["joinPublicOrganization"],
          }),
        ]),
      );
    });

    test("Returns an error when the user is present in the token but not found in the database", async () => {
      const regularUser = await createRegularUserUsingAdmin();
      const { authToken } = regularUser;
      const organization = await createTestOrganization();
      testCleanupFunctions.push(organization.cleanup);

      await server.drizzleClient
        .delete(usersTable)
        .where(eq(usersTable.id, regularUser.userId))
        .execute();

      const result = await mercuriusClient.mutate(
        Mutation_joinPublicOrganization,
        {
          headers: {
            authorization: `bearer ${authToken}`,
          },
          variables: {
            input: {
              organizationId: organization.orgId,
            },
          },
        },
      );

      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual(
        expect.arrayContaining<TalawaGraphQLFormattedError>([
          expect.objectContaining<TalawaGraphQLFormattedError>({
            extensions: expect.objectContaining<UnauthenticatedExtensions>({
              code: "unauthenticated",
            }),
            message: expect.any(String),
            path: ["joinPublicOrganization"],
          }),
        ]),
      );
    });
  });

  suite("Input Validation", () => {
    const testCleanupFunctions: Array<() => Promise<void>> = [];

    afterEach(async () => {
      for (const cleanup of testCleanupFunctions.reverse()) {
        try {
          await cleanup();
        } catch (error) {
          console.error("Cleanup failed:", error);
        }
      }
      testCleanupFunctions.length = 0;
    });

    test("Returns an error when organizationId is not a valid UUID", async () => {
      const regularUser = await createRegularUserUsingAdmin();
      const { authToken } = regularUser;

      const result = await mercuriusClient.mutate(
        Mutation_joinPublicOrganization,
        {
          headers: {
            authorization: `bearer ${authToken}`,
          },
          variables: {
            input: {
              organizationId: "invalid-uuid",
            },
          },
        },
      );

      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual(
        expect.arrayContaining<TalawaGraphQLFormattedError>([
          expect.objectContaining<TalawaGraphQLFormattedError>({
            extensions: expect.objectContaining({
              code: "invalid_arguments",
              issues: expect.arrayContaining([
                expect.objectContaining({
                  argumentPath: expect.arrayContaining(["input", "organizationId"]),
                }),
              ]),
            }),
            message: expect.any(String),
          }),
        ]),
      );
    });

    test("Returns an error when organizationId is not provided", async () => {
      const regularUser = await createRegularUserUsingAdmin();
      const { authToken } = regularUser;

      const result = await mercuriusClient.mutate(
        Mutation_joinPublicOrganization,
        {
          headers: {
            authorization: `bearer ${authToken}`,
          },
          variables: {
            input: {
              organizationId: "",
            },
          },
        },
      );

      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual(
        expect.arrayContaining<TalawaGraphQLFormattedError>([
          expect.objectContaining<TalawaGraphQLFormattedError>({
            extensions: expect.objectContaining({
              code: "invalid_arguments",
              issues: expect.arrayContaining([
                expect.objectContaining({
                  argumentPath: expect.arrayContaining(["input", "organizationId"]),
                }),
              ]),
            }),
            message: expect.any(String),
          }),
        ]),
      );
    });
  });

  suite("Business Logic", () => {
    const testCleanupFunctions: Array<() => Promise<void>> = [];

    afterEach(async () => {
      for (const cleanup of testCleanupFunctions.reverse()) {
        try {
          await cleanup();
        } catch (error) {
          console.error("Cleanup failed:", error);
        }
      }
      testCleanupFunctions.length = 0;
    });

    test("Returns an error when the organization does not exist", async () => {
      const regularUser = await createRegularUserUsingAdmin();
      const { authToken } = regularUser;

      const result = await mercuriusClient.mutate(
        Mutation_joinPublicOrganization,
        {
          headers: {
            authorization: `bearer ${authToken}`,
          },
          variables: {
            input: {
              organizationId: faker.string.uuid(),
            },
          },
        },
      );

      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual(
        expect.arrayContaining<TalawaGraphQLFormattedError>([
          expect.objectContaining<TalawaGraphQLFormattedError>({
            extensions: expect.objectContaining({
              code: "arguments_associated_resources_not_found",
              issues: expect.arrayContaining([
                expect.objectContaining({
                  argumentPath: expect.arrayContaining(["input", "organizationId"]),
                }),
              ]),
            }),
            message: expect.any(String),
          }),
        ]),
      );
    });

    test("Returns an error when the organization requires user registration", async () => {
      const regularUser = await createRegularUserUsingAdmin();
      const { authToken } = regularUser;
      const organization = await createTestOrganization(true); // Create org with registration required
      testCleanupFunctions.push(organization.cleanup);

      const result = await mercuriusClient.mutate(
        Mutation_joinPublicOrganization,
        {
          headers: {
            authorization: `bearer ${authToken}`,
          },
          variables: {
            input: {
              organizationId: organization.orgId,
            },
          },
        },
      );

      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "forbidden_action",
              message: "This organization requires user registration before joining.",
            }),
            message: expect.any(String),
          }),
        ]),
      );
    });

    test("Returns an error when the user is already a member of the organization", async () => {
      const regularUser = await createRegularUserUsingAdmin();
      const { authToken } = regularUser;
      const organization = await createTestOrganization();
      testCleanupFunctions.push(organization.cleanup);

      // Add the user as a member first
      await server.drizzleClient
        .insert(organizationMembershipsTable)
        .values({
          memberId: regularUser.userId,
          organizationId: organization.orgId,
          role: "regular",
          creatorId: regularUser.userId,
        })
        .execute();

      const result = await mercuriusClient.mutate(
        Mutation_joinPublicOrganization,
        {
          headers: {
            authorization: `bearer ${authToken}`,
          },
          variables: {
            input: {
              organizationId: organization.orgId,
            },
          },
        },
      );

      expect(result.errors).toBeDefined();
      expect(result.errors).toEqual(
        expect.arrayContaining<TalawaGraphQLFormattedError>([
          expect.objectContaining<TalawaGraphQLFormattedError>({
            extensions: expect.objectContaining({
              code: "invalid_arguments",
              issues: expect.arrayContaining([
                expect.objectContaining({
                  argumentPath: expect.arrayContaining(["input", "organizationId"]),
                  message: "User is already a member of this organization",
                }),
              ]),
            }),
            message: expect.any(String),
          }),
        ]),
      );
    });

    test("Successfully joins the organization when all conditions are met", async () => {
      const regularUser = await createRegularUserUsingAdmin();
      const { authToken } = regularUser;
      const organization = await createTestOrganization();
      testCleanupFunctions.push(organization.cleanup);

      const result = await mercuriusClient.mutate(
        Mutation_joinPublicOrganization,
        {
          headers: {
            authorization: `bearer ${authToken}`,
          },
          variables: {
            input: {
              organizationId: organization.orgId,
            },
          },
        },
      );

      expect(result.errors).toBeUndefined();
      expect(result.data).toBeDefined();
      assertToBeNonNullish(result.data?.joinPublicOrganization);

      expect(result.data.joinPublicOrganization.memberId).toEqual(regularUser.userId);
      expect(result.data.joinPublicOrganization.organizationId).toEqual(organization.orgId);
      expect(result.data.joinPublicOrganization.role).toEqual("regular");
      expect(result.data.joinPublicOrganization.creatorId).toEqual(regularUser.userId);

      // Verify in database
      const membership = await server.drizzleClient.query.organizationMembershipsTable.findFirst(
        {
          where: (fields, operators) =>
            operators.and(
              operators.eq(fields.memberId, regularUser.userId),
              operators.eq(fields.organizationId, organization.orgId),
            ),
        },
      );

      expect(membership).toBeDefined();
      expect(membership?.role).toEqual("regular");
    });

    test("Returns unexpected error when membership creation fails", async () => {
      const regularUser = await createRegularUserUsingAdmin();
      const { authToken } = regularUser;
      const organization = await createTestOrganization();
      testCleanupFunctions.push(organization.cleanup);

      // Mock transaction to simulate failed insertion
      const originalTransaction = server.drizzleClient.transaction;
      server.drizzleClient.transaction = vi.fn().mockImplementation(async (fn) => {
        const mockTxClient = {
          query: {
            organizationMembershipsTable: {
              findFirst: vi.fn().mockResolvedValue(null)
            }
          },
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([]) // Empty array simulates failure
        };
        return fn(mockTxClient);
      });

      try {
        const result = await mercuriusClient.mutate(
          Mutation_joinPublicOrganization,
          {
            headers: {
              authorization: `bearer ${authToken}`,
            },
            variables: {
              input: {
                organizationId: organization.orgId,
              },
            },
          },
        );

        expect(result.errors).toBeDefined();
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              extensions: expect.objectContaining({
                code: "unexpected",
              }),
              message: expect.any(String),
              path: ["joinPublicOrganization"],
            }),
          ]),
        );
      } finally {
        // Restore original implementation
        server.drizzleClient.transaction = originalTransaction;
      }
    });
  });
});