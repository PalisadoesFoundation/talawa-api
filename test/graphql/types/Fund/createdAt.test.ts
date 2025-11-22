import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Fund } from "~/src/graphql/types/Fund/Fund";
import "~/src/graphql/types/Fund/createdAt"; 
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Fund Resolver - createdAt Field", () => {
  type TestContext = GraphQLContext & {
    schema: {
      Fund: {
        fields: {
          createdAt: {
            resolve: (
              parent: Fund,
              args: Record<string, unknown>,
              context: GraphQLContext,
            ) => Promise<Date | string>;
          };
        };
      };
    };
  };

  let ctx: TestContext;
  let mockFund: Fund;
  let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

  const resolveCreatedAt = () =>
    ctx.schema.Fund.fields.createdAt.resolve(mockFund, {}, ctx);

  beforeEach(() => {
    vi.clearAllMocks();
    const { context, mocks: newMocks } = createMockGraphQLContext(
      true,
      "user-1",
    );
    ctx = context as unknown as TestContext;
    mocks = newMocks;

    mockFund = {
      id: "fund-1",
      name: "Test Fund",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      updatedAt: new Date(),
      organizationId: "org-123",
      creatorId: "creator-1",
      updaterId: "user-1",
      isTaxDeductible: false,
    };

    mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
      id: "user-1",
      role: "member",
      organizationMembershipsWhereMember: [{ role: "member" }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Authentication", () => {
    it("throws unauthenticated error when user is not authenticated", async () => {
      ctx.currentClient.isAuthenticated = false;

      await expect(resolveCreatedAt()).rejects.toThrow(
        new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
      );
    });

    it("throws unauthenticated error when user is not found in database", async () => {
      mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
        undefined,
      );

      await expect(resolveCreatedAt()).rejects.toThrow(
        new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
      );
    });
  });

  describe("Authorization", () => {
    it("throws unauthorized_action when user has no organization memberships and is not admin", async () => {
      mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
        id: "user-1",
        role: "member",
        organizationMembershipsWhereMember: [], 
      });

      await expect(resolveCreatedAt()).rejects.toThrow(
        new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
      );
    });

    it("returns createdAt for admin users (even if not in org)", async () => {
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

  describe("Database Filters", () => {
    it("should query organization memberships with correct organizationId filter", async () => {
      const findFirstSpy = vi.fn().mockResolvedValue({
        id: "user-1",
        role: "member",
        organizationMembershipsWhereMember: [{ role: "member" }],
      });
      mocks.drizzleClient.query.usersTable.findFirst = findFirstSpy;

      await resolveCreatedAt();

      const firstCall = findFirstSpy.mock.calls[0]?.[0];
      expect(firstCall).toBeDefined();

      const whereFunction =
        firstCall?.with?.organizationMembershipsWhereMember?.where;

      expect(whereFunction).toBeDefined();

      if (whereFunction) {
        const mockFields = { organizationId: "mock_field_org_id" };
        const mockOperators = { eq: vi.fn() };

        whereFunction(mockFields, mockOperators);

        expect(mockOperators.eq).toHaveBeenCalledWith(
          mockFields.organizationId,
          mockFund.organizationId,
        );
      }
    });
  });
});