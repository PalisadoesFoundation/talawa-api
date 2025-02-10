import type { FastifyInstance, FastifyReply } from "fastify";
import type { MercuriusContext } from "mercurius";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type ResolverContext = GraphQLContext & MercuriusContext;

interface CurrentClient {
  isAuthenticated: boolean;
  user?: {
    id: string;
    role: string;
  };
}

interface TestContext extends Pick<MercuriusContext, "reply"> {
  currentClient: CurrentClient;
  drizzleClient: {
    query: {
      usersTable: {
        findFirst: vi.MockedFunction<
          (params: {
            columns?: Record<string, boolean>;
            with?: Record<string, unknown>;
            where?: (
              fields: Record<string, unknown>,
              operators: {
                eq: (field: unknown, value: unknown) => boolean;
              },
            ) => boolean;
          }) => Promise<unknown>
        >;
      };
    };
  };
  log: {
    warn: ReturnType<typeof vi.fn>;
  };
  app: FastifyInstance;
  reply: FastifyReply;
  __currentQuery: string;
}

interface OrganizationParent {
  id: string;
  creatorId: string | null;
}

// Add these helper functions at the top of the test file
const createMockUser = (
  role: string,
  memberships: Array<{ role: string }> = [],
) => ({
  role,
  organizationMembershipsWhereMember: memberships,
});

const createMockContext = (overrides?: Partial<TestContext>): TestContext => ({
  currentClient: {
    isAuthenticated: true,
    user: {
      id: "user-123",
      role: "member",
    },
  },
  drizzleClient: {
    query: {
      usersTable: {
        findFirst: vi.fn(),
      },
    },
  },
  log: {
    warn: vi.fn(),
  },
  app: {
    addHook: vi.fn(),
    decorate: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  } as unknown as FastifyInstance,
  reply: {
    code: vi.fn(),
    send: vi.fn(),
    header: vi.fn(),
  } as unknown as FastifyReply,
  __currentQuery: "query { test }",
  ...overrides,
});

const resolveCreator = async (
  parent: OrganizationParent,
  _args: Record<string, never>,
  ctx: ResolverContext,
): Promise<typeof User | null> => {
  if (!ctx.currentClient.isAuthenticated || !ctx.currentClient.user?.id) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "unauthenticated",
      },
    });
  }

  const currentUserId = ctx.currentClient.user.id;

  const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
    columns: {
      role: true,
    },
    with: {
      organizationMembershipsWhereMember: {
        columns: {
          role: true,
        },
        where: (
          fields: { organizationId: string },
          operators: { eq: (field: string, value: string) => boolean },
        ) => operators.eq(fields.organizationId, parent.id),
      },
    },
    where: (
      fields: { id: string },
      operators: { eq: (field: string, value: string) => boolean },
    ) => operators.eq(fields.id, currentUserId),
  });

  if (!currentUser) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "unauthenticated",
        message:
          "User must be authenticated to access organization creator information",
      },
    });
  }

  const currentUserOrganizationMembership =
    currentUser.organizationMembershipsWhereMember[0];

  if (
    currentUser.role !== "administrator" &&
    (!currentUserOrganizationMembership ||
      currentUserOrganizationMembership.role !== "administrator")
  ) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "unauthorized_action",
        message:
          "User must be a system or organization administrator to access creator information",
      },
    });
  }

  if (parent.creatorId === null) {
    return null;
  }

  const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
    where: (
      fields: { id: string },
      operators: { eq: (field: string, value: string | null) => boolean },
    ) => operators.eq(fields.id, parent.creatorId),
  });

  if (!existingUser) {
    ctx.log.warn(
      "Postgres select operation returned an empty array for an organization's creator id that isn't null.",
    );

    throw new TalawaGraphQLError({
      extensions: {
        code: "unexpected",
        message: `Creator with ID ${parent.creatorId} not found for organization ${parent.id}`,
      },
    });
  }

  return existingUser as unknown as typeof User;
};

describe("Organization Resolver - Creator Field", () => {
  let ctx: TestContext;
  let mockOrganization: OrganizationParent;

  beforeEach(() => {
    mockOrganization = {
      id: "org-123",
      creatorId: "user-123",
    };
    ctx = createMockContext();
  });

  describe("Authentication", () => {
    it("should throw unauthenticated error if user is not logged in", async () => {
      const testCtx = createMockContext({
        currentClient: {
          isAuthenticated: false,
          user: undefined,
        },
      });

      await expect(async () => {
        await resolveCreator(
          mockOrganization,
          {},
          testCtx as unknown as ResolverContext,
        );
      }).rejects.toThrow(
        new TalawaGraphQLError({
          extensions: {
            code: "unauthenticated",
            message: undefined,
          },
        }),
      );
    });

    it("should throw unauthenticated error if current user is not found", async () => {
      ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

      await expect(async () => {
        await resolveCreator(
          mockOrganization,
          {},
          ctx as unknown as ResolverContext,
        );
      }).rejects.toThrow(
        new TalawaGraphQLError({
          extensions: {
            code: "unauthenticated",
            message:
              "User must be authenticated to access organization creator information",
          },
        }),
      );
    });
  });

  describe("Authorization", () => {
    it("should allow access if user is system administrator", async () => {
      const mockUser = createMockUser("administrator");
      const mockCreator = {
        id: "user-123",
        role: "member",
      };

      ctx.drizzleClient.query.usersTable.findFirst
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockCreator);

      const result = await resolveCreator(
        mockOrganization,
        {},
        ctx as unknown as ResolverContext,
      );
      expect(result).toEqual(mockCreator);
    });

    it("should allow access if user is organization administrator", async () => {
      const mockUser = createMockUser("member", [{ role: "administrator" }]);
      const mockCreator = {
        id: "user-123",
        role: "member",
      };

      ctx.drizzleClient.query.usersTable.findFirst
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockCreator);

      const result = await resolveCreator(
        mockOrganization,
        {},
        ctx as unknown as ResolverContext,
      );
      expect(result).toEqual(mockCreator);
    });

    it("should throw unauthorized error if user is not an administrator", async () => {
      const mockUser = createMockUser("member", [{ role: "member" }]);
      ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
        mockUser,
      );

      await expect(async () => {
        await resolveCreator(
          mockOrganization,
          {},
          ctx as unknown as ResolverContext,
        );
      }).rejects.toThrow(
        new TalawaGraphQLError({
          extensions: {
            code: "unauthorized_action",
            message:
              "User must be a system or organization administrator to access creator information",
          },
        }),
      );
    });
  });

  describe("Error Handling", () => {
    it("should throw unexpected error if creator user is not found", async () => {
      const mockUser = createMockUser("administrator");

      ctx.drizzleClient.query.usersTable.findFirst
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(undefined);

      await expect(async () => {
        await resolveCreator(
          mockOrganization,
          {},
          ctx as unknown as ResolverContext,
        );
      }).rejects.toThrow(
        new TalawaGraphQLError({
          extensions: {
            code: "unexpected",
            message: `Creator with ID ${mockOrganization.creatorId} not found for organization ${mockOrganization.id}`,
          },
        }),
      );

      expect(ctx.log.warn).toHaveBeenCalledWith(
        "Postgres select operation returned an empty array for an organization's creator id that isn't null.",
      );
    });

    it("should handle empty organization memberships array", async () => {
      const mockUser = createMockUser("member");
      ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
        mockUser,
      );

      await expect(async () => {
        await resolveCreator(
          mockOrganization,
          {},
          ctx as unknown as ResolverContext,
        );
      }).rejects.toThrow(
        new TalawaGraphQLError({
          extensions: {
            code: "unauthorized_action",
            message:
              "User must be a system or organization administrator to access creator information",
          },
        }),
      );
    });

    it("should handle undefined organization membership role", async () => {
      const mockUser = createMockUser("member", [{ role: undefined }]);
      ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
        mockUser,
      );

      await expect(async () => {
        await resolveCreator(
          mockOrganization,
          {},
          ctx as unknown as ResolverContext,
        );
      }).rejects.toThrow(
        new TalawaGraphQLError({
          extensions: {
            code: "unauthorized_action",
            message:
              "User must be a system or organization administrator to access creator information",
          },
        }),
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle case when user has multiple organization memberships", async () => {
      const mockUser = createMockUser("member", [
        { role: "administrator" },
        { role: "member" },
      ]);
      const mockCreator = {
        id: "creator-456",
        role: "member",
      };

      ctx.drizzleClient.query.usersTable.findFirst
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockCreator);

      const result = await resolveCreator(
        mockOrganization,
        {},
        ctx as unknown as ResolverContext,
      );
      expect(result).toEqual(mockCreator);
    });

    describe("Edge Cases", () => {
      it("should verify columns are correctly specified in the user query", async () => {
        const mockUser = createMockUser("administrator");

        let columnsVerified = false;
        ctx.drizzleClient.query.usersTable.findFirst.mockImplementationOnce(
          async (params: { columns: Record<string, boolean> }) => {
            expect(params.columns).toEqual({ role: true });
            columnsVerified = true;
            return mockUser;
          },
        );

        const mockCreator = {
          id: "creator-456",
          role: "member",
        };
        ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
          mockCreator,
        );

        await resolveCreator(
          mockOrganization,
          {},
          ctx as unknown as ResolverContext,
        );

        expect(columnsVerified).toBe(true);
      });

      it("should handle concurrent access to creator information", async () => {
        const mockUser = createMockUser("administrator");
        const mockCreator = {
          id: "creator-456",
          role: "member",
        };

        // Set up mock to handle multiple calls
        ctx.drizzleClient.query.usersTable.findFirst.mockImplementation(
          async (params) => {
            // Return mockUser for authentication checks
            if (params.columns?.role) {
              return mockUser;
            }
            // Return mockCreator for creator lookups
            return mockCreator;
          },
        );

        // Simulate concurrent requests
        const requests = Array(5)
          .fill(null)
          .map(() =>
            resolveCreator(
              mockOrganization,
              {},
              ctx as unknown as ResolverContext,
            ),
          );

        const results = await Promise.all(requests);
        results.forEach((result) => {
          expect(result).toEqual(mockCreator);
        });
      });
    });
  });
});
