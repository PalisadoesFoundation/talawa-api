import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "../../../../src/graphql/context";
import type { FastifyBaseLogger } from "fastify";
import { User } from "~/src/graphql/types/User/User";
import { Fund } from "~/src/graphql/types/Fund/Fund";
import { createMockLogger } from "test/utilities/mockLogger";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { resolveUpdater } from "~/src/graphql/types/Fund/updater";

type DeepPartial<T> = Partial<T>;
interface TestContext extends Omit<GraphQLContext, "log"> {
  drizzleClient: {
    query: {
      usersTable: {
        findFirst: ReturnType<typeof vi.fn>;
      };
    };
  } & GraphQLContext["drizzleClient"];
  log: FastifyBaseLogger;
}

describe("Fund Resolver - Updater Field", () => {
  let ctx: TestContext;
  let mockUser: DeepPartial<User>;
  let mockFund: Fund;

  beforeEach(() => {
    mockUser = {
      id: "123",
      name: "John Doe",
      role: "administrator",
      createdAt: new Date(),
    };

    mockFund = {
      createdAt: new Date(),
      name: "Student Fund",
      id: "fund-111",
      creatorId: "000",
      updatedAt: new Date(),
      updaterId: "id-222",
      organizationId: "org-01",
      isTaxDeductible: false,
    };

    const mockLogger = createMockLogger();
    vi.clearAllMocks();

    ctx = {
      drizzleClient: {
        query: {
          usersTable: {
            findFirst: vi.fn().mockResolvedValue(mockUser),
          },
        },
      },
      currentClient: {
        isAuthenticated: true,
        user: { id: "321" },
      },
      log: mockLogger,
    } as unknown as TestContext;
  });

  it("should return null if updaterId is null", async () => {
    mockFund.updaterId = null;
    await expect(resolveUpdater(mockFund, {}, ctx)).resolves.toBeNull();
  });

  it("should throw unauthenticated error when user is not authenticated", async () => {
    ctx.currentClient.isAuthenticated = false;
    await expect(resolveUpdater(mockFund, {}, ctx)).rejects.toThrow(
      expect.objectContaining({ extensions: { code: "unauthenticated" } })
    );
  });

  it("should throw unauthorized error when user is not administrator", async () => {
    mockUser.role = "regular";
    ctx.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
      mockUser
    );
    await expect(resolveUpdater(mockFund, {}, ctx)).rejects.toThrow(
      new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } })
    );
  });

  it("should return current user if updaterId matches current user id", async () => {
    mockFund.updaterId = "123";
    await expect(resolveUpdater(mockFund, {}, ctx)).resolves.toEqual(mockUser);
  });

  it("should fetch updater user if updaterId is different", async () => {
    const updaterUser: DeepPartial<User> = { id: "456", name: "Updater User" };

    ctx.drizzleClient.query.usersTable.findFirst
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(updaterUser);

    await expect(resolveUpdater(mockFund, {}, ctx)).resolves.toEqual(
      updaterUser
    );
  });

  it("should throw unexpected error if updater user does not exist", async () => {
    ctx.drizzleClient.query.usersTable.findFirst
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(undefined);

    await expect(resolveUpdater(mockFund, {}, ctx)).rejects.toThrow(
      new TalawaGraphQLError({ extensions: { code: "unexpected" } })
    );

    expect(ctx.log.error).toHaveBeenCalledWith(
      "Postgres select operation returned an empty array for a fund's updater id that isn't null."
    );
  });
});
