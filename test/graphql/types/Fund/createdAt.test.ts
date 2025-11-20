import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Fund } from "~/src/graphql/types/Fund/Fund";
import type { GraphQLContext } from "~/src/graphql/context";
import "~/src/graphql/types/Fund/createdAt";

describe("Fund Resolver - createdAt Field", () => {
  let ctx: GraphQLContext | any;
  let mockFund: Fund;
  let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

  const resolveCreatedAt = () =>
    ctx.schema.Fund.fields.createdAt.resolve(mockFund, {}, ctx);

  beforeEach(() => {
    vi.clearAllMocks();

    const { context, mocks: newMocks } = createMockGraphQLContext(true, "user-1");
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws unauthenticated error when user is not authenticated", async () => {
    ctx.currentClient.isAuthenticated = false;

    await expect(resolveCreatedAt()).rejects.toMatchObject({ extensions: { code: "unauthenticated" } });
  });

  it("throws unauthenticated error when user is not found", async () => {
    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

    await expect(resolveCreatedAt()).rejects.toMatchObject({ extensions: { code: "unauthenticated" } });
  });

  it("throws unauthorized_action when user has no organization memberships and is not admin", async () => {
    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
      id: "user-1",
      role: "member",
      organizationMembershipsWhereMember: [],
    });

    await expect(resolveCreatedAt()).rejects.toMatchObject({ extensions: { code: "unauthorized_action" } });
  });

  it("returns createdAt for admin users", async () => {
    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
      id: "user-1",
      role: "administrator",
      organizationMembershipsWhereMember: [],
    });

    const result = await resolveCreatedAt();
    expect(result).toEqual(mockFund.createdAt);
  });

  it("returns createdAt for users with organization membership", async () => {
    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
      id: "user-1",
      role: "member",
      organizationMembershipsWhereMember: [{ role: "member" }],
    });

    const result = await resolveCreatedAt();
    expect(result).toEqual(mockFund.createdAt);
  });
});
