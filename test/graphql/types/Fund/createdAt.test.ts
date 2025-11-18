import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Fund } from "~/src/graphql/types/Fund/Fund";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import "~/src/graphql/types/Fund/createdAt";

describe("Fund Resolver - createdAt Field", () => {
  let ctx: any;
  let mockFund: Fund;
  let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

  beforeEach(() => {
    const { context, mocks: newMocks } = createMockGraphQLContext(
      true,
      "user-1"
    );
    ctx = context;
    mocks = newMocks;

    mockFund = {
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      name: "Healthcare Fund",
      id: "fund-1",
      creatorId: "creator-1",
      updatedAt: new Date(),
      updaterId: "user-1",
      organizationId: "org-123",
      isTaxDeductible: false,
    };

    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
      id: "user-1",
      role: "member",
      organizationMembershipsWhereMember: [],
    });

    vi.clearAllMocks();
  });

  it("throws unauthenticated error when user is not authenticated", async () => {
    ctx.currentClient.isAuthenticated = false;

    await expect(
      ctx.schema.Fund.fields.createdAt.resolve(mockFund, {}, ctx)
    ).rejects.toThrow(
      new TalawaGraphQLError({ extensions: { code: "unauthenticated" } })
    );
  });

  it("throws unauthenticated error when user is not found", async () => {
    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

    await expect(
      ctx.schema.Fund.fields.createdAt.resolve(mockFund, {}, ctx)
    ).rejects.toThrow(
      new TalawaGraphQLError({ extensions: { code: "unauthenticated" } })
    );
  });

  it("throws unauthorized_action when user has no organization memberships", async () => {
    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
      id: "user-1",
      role: "member",
      organizationMembershipsWhereMember: [],
    });

    await expect(
      ctx.schema.Fund.fields.createdAt.resolve(mockFund, {}, ctx)
    ).rejects.toThrow(
      new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } })
    );
  });

  it("returns createdAt for admin users", async () => {
    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
      id: "user-1",
      role: "administrator",
      organizationMembershipsWhereMember: [],
    });

    const result = await ctx.schema.Fund.fields.createdAt.resolve(
      mockFund,
      {},
      ctx
    );
    expect(result).toEqual(mockFund.createdAt);
  });

  it("returns createdAt for users with organization membership", async () => {
    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
      id: "user-1",
      role: "member",
      organizationMembershipsWhereMember: [
        {
          role: "member",
        },
      ],
    });

    const result = await ctx.schema.Fund.fields.createdAt.resolve(
      mockFund,
      {},
      ctx
    );
    expect(result).toEqual(mockFund.createdAt);
  });
});
