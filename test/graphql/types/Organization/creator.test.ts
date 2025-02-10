import { eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { MercuriusContext } from "mercurius";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "../../../../src/graphql/context";
import type { User } from "../../../../src/graphql/types/User/User";
import { TalawaGraphQLError } from "../../../../src/utilities/TalawaGraphQLError";

type ResolverContext = GraphQLContext & MercuriusContext;

interface CurrentClient {
  isAuthenticated: boolean;
  user?: {
    id: string;
    role: string;
  };
}

interface TestContext extends Partial<MercuriusContext> {
  currentClient: CurrentClient;
  drizzleClient: {
    query: {
      usersTable: {
        findFirst: ReturnType<typeof vi.fn>;
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

interface UserWithMemberships extends Omit<User, "role"> {
  role: "administrator" | "regular" | "member";
  organizationMembershipsWhereMember: Array<{
    role: "administrator" | "regular" | "member";
    organizationId: string;
  }>;
}

const createMockUser = (
  role: "administrator" | "regular" | "member",
  memberships: Array<{
    role: "administrator" | "regular" | "member";
    organizationId: string;
  }> = [],
): UserWithMemberships => ({
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
): Promise<User | null> => {
  if (!ctx.currentClient.isAuthenticated || !ctx.currentClient.user?.id) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "unauthenticated",
      },
    });
  }

  const currentUserId = ctx.currentClient.user.id;

  const currentUser = (await ctx.drizzleClient.query.usersTable.findFirst({
    columns: {
      role: true,
    },
    with: {
      organizationMembershipsWhereMember: {
        columns: {
          role: true,
          organizationId: true,
        },
        where: (fields, operators) => {
          return operators.eq(fields.organizationId, parent.id);
        },
      },
    },
    where: (userFields, { eq }) => eq(userFields.id, currentUserId),
  })) as UserWithMemberships | undefined;

  if (!currentUser) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "unauthenticated",
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
      },
    });
  }

  if (parent.creatorId === null) {
    return null;
  }

  const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
    where: (userFields) => eq(userFields.id, parent.creatorId || ""),
  });

  if (!existingUser) {
    ctx.log.warn(
      "Postgres select operation returned an empty array for an organization's creator id that isn't null.",
    );

    throw new TalawaGraphQLError({
      extensions: {
        code: "unexpected",
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
          extensions: { code: "unauthenticated" },
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
          extensions: { code: "unauthenticated" },
        }),
      );
    });
  });

  describe("Authorization", () => {
    it("should allow access if user is system administrator", async () => {
      const mockUser = createMockUser("administrator");
      const mockCreator = { id: "user-123", role: "member" };

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
      const mockUser = createMockUser("member", [
        { role: "administrator", organizationId: "org-123" },
      ]);
      const mockCreator = { id: "user-123", role: "member" };

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
      const mockUser = createMockUser("member", [
        { role: "member", organizationId: "org-123" },
      ]);
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
          extensions: { code: "unauthorized_action" },
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
          extensions: { code: "unexpected" },
        }),
      );

      expect(ctx.log.warn).toHaveBeenCalledWith(
        "Postgres select operation returned an empty array for an organization's creator id that isn't null.",
      );
    });
  });

  describe("Edge Cases", () => {
    it("should return null if organization has no creator", async () => {
      mockOrganization.creatorId = null;
      const mockUser = createMockUser("administrator");
      ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
        mockUser,
      );

      const result = await resolveCreator(
        mockOrganization,
        {},
        ctx as unknown as ResolverContext,
      );
      expect(result).toBeNull();
    });

    it("should handle multiple organization memberships", async () => {
      const mockUser = createMockUser("member", [
        { role: "administrator", organizationId: "org-123" },
        { role: "member", organizationId: "other-org" },
      ]);
      const mockCreator = { id: "creator-456", role: "member" };

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
  });
});
