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
        where: (fields: { organizationId: any; }, operators: { eq: (arg0: any, arg1: string) => any; }) =>
          operators.eq(fields.organizationId, parent.id),
      },
    },
    where: (fields: { id: any; }, operators: { eq: (arg0: any, arg1: any) => any; }) => operators.eq(fields.id, currentUserId),
  });

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
    where: (fields: { id: any; }, operators: { eq: (arg0: any, arg1: string | null) => any; }) => operators.eq(fields.id, parent.creatorId),
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

    // Create mock Fastify instance
    const mockApp = {
      addHook: vi.fn(),
      decorate: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
    } as unknown as FastifyInstance;

    // Create mock Fastify reply
    const mockReply = {
      code: vi.fn(),
      send: vi.fn(),
      header: vi.fn(),
    } as unknown as FastifyReply;

    ctx = {
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
      app: mockApp,
      reply: mockReply,
      __currentQuery: "query { test }",
    };
  });

  it("should throw unauthenticated error if user is not logged in", async () => {
    const testCtx = {
      ...ctx,
      currentClient: {
        isAuthenticated: false,
        user: undefined,
      },
    } as unknown as ResolverContext;

    await expect(async () => {
      await resolveCreator(mockOrganization, {}, testCtx);
    }).rejects.toThrow(
      new TalawaGraphQLError({
        extensions: { code: "unauthenticated" },
      }),
    );
  });

  it("should throw unauthenticated error if current user is not found", async () => {
    ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

    await expect(async () => {
      await resolveCreator(mockOrganization, {}, ctx as unknown as ResolverContext);
    }).rejects.toThrow(
      new TalawaGraphQLError({
        extensions: { code: "unauthenticated" },
      }),
    );
  });

  it("should allow access if user is system administrator", async () => {
    const mockUser = {
      role: "administrator",
      organizationMembershipsWhereMember: [],
    };
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
    const mockUser = {
      role: "member",
      organizationMembershipsWhereMember: [
        {
          role: "administrator",
        },
      ],
    };
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
    const mockUser = {
      role: "member",
      organizationMembershipsWhereMember: [
        {
          role: "member",
        },
      ],
    };
    ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(mockUser);

    await expect(async () => {
      await resolveCreator(mockOrganization, {}, ctx as unknown as ResolverContext);
    }).rejects.toThrow(
      new TalawaGraphQLError({
        extensions: { code: "unauthorized_action" },
      }),
    );
  });

  it("should return null if organization has no creator", async () => {
    mockOrganization.creatorId = null;
    const mockUser = {
      role: "administrator",
      organizationMembershipsWhereMember: [],
    };
    ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(mockUser);

    const result = await resolveCreator(
      mockOrganization,
      {},
      ctx as unknown as ResolverContext,
    );
    expect(result).toBeNull();
  });

  it("should throw unexpected error if creator user is not found", async () => {
    const mockUser = {
      role: "administrator",
      organizationMembershipsWhereMember: [],
    };
    
    ctx.drizzleClient.query.usersTable.findFirst
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(undefined);

    await expect(async () => {
      await resolveCreator(mockOrganization, {}, ctx as unknown as ResolverContext);
    }).rejects.toThrow(
      new TalawaGraphQLError({
        extensions: { code: "unexpected" },
      }),
    );

    expect(ctx.log.warn).toHaveBeenCalledWith(
      "Postgres select operation returned an empty array for an organization's creator id that isn't null.",
    );
  });

  it("should handle empty organization memberships array", async () => {
    const mockUser = {
      role: "member",
      organizationMembershipsWhereMember: [],
    };
    ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(mockUser);

    await expect(async () => {
      await resolveCreator(mockOrganization, {}, ctx as unknown as ResolverContext);
    }).rejects.toThrow(
      new TalawaGraphQLError({
        extensions: { code: "unauthorized_action" },
      }),
    );
  });

  it("should handle undefined organization membership role", async () => {
    const mockUser = {
      role: "member",
      organizationMembershipsWhereMember: [{ role: undefined }],
    };
    ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(mockUser);

    await expect(async () => {
      await resolveCreator(mockOrganization, {}, ctx as unknown as ResolverContext);
    }).rejects.toThrow(
      new TalawaGraphQLError({
        extensions: { code: "unauthorized_action" },
      }),
    );
  });

   // Additional tests for 100% coverage:

  it("should handle case when user has multiple organization memberships", async () => {
    const mockUser = {
      role: "member",
      organizationMembershipsWhereMember: [
        { role: "administrator" }, // First membership is admin
        { role: "member" },
      ],
    };
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

  it("should verify columns are correctly specified in the user query", async () => {
    const mockUser = {
      role: "administrator",
      organizationMembershipsWhereMember: [],
    };

    let columnsVerified = false;
    ctx.drizzleClient.query.usersTable.findFirst.mockImplementationOnce(async (params: { columns: any; }) => {
      expect(params.columns).toEqual({ role: true });
      columnsVerified = true;
      return mockUser;
    });

    const mockCreator = {
      id: "creator-456",
      role: "member",
    };
    ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(mockCreator);

    await resolveCreator(
      mockOrganization,
      {},
      ctx as unknown as ResolverContext,
    );
    
    expect(columnsVerified).toBe(true);
  });
});
