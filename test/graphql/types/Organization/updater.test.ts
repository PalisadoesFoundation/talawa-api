import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { OrganizationUpdater } from "~/src/graphql/types/Organization/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import type { Organization } from "~/src/graphql/types/Organization/Organization";

describe("Organization Resolver: Updater Field", () => {
  let ctx: GraphQLContext;
  let mockOrganization: Organization;
  let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

  beforeEach(() => {
    const { context, mocks: newMocks } = createMockGraphQLContext(
      true,
      "user-123"
    );

    mockOrganization = {
      id: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
      name: "Test Organization",
      description: "Test Description",
      creatorId: "123e4567-e89b-12d3-a456-426614174000",
      createdAt: new Date("2024-02-07T10:30:00.000Z"),
      updatedAt: new Date("2024-02-07T12:00:00.000Z"),
      addressLine1: null,
      addressLine2: null,
      avatarMimeType: null,
      avatarName: null,
      city: null,
      countryCode: null,
      updaterId: "123e4567-e89b-12d3-a456-426614174000",
      state: null,
      postalCode: null,
    };

    ctx = context;
    mocks = newMocks;
    vi.clearAllMocks();
  });

  describe("Authorization Checks", () => {
    it("should throw unauthorized_action if user is not an administrator", async () => {
      mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
        id: "user-123",
        role: "member",
        organizationMembershipsWhereMember: [
          { role: "member", organizationId: mockOrganization.id },
        ],
      });
      await expect(
        OrganizationUpdater(mockOrganization, {}, ctx)
      ).rejects.toThrow(
        new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } })
      );
    });
  });

  describe("Updater Retrieval", () => {
    it("should return null if `updaterId` is null", async () => {
      mockOrganization.updaterId = null;

      mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
        id: "user-123",
        role: "administrator",
        organizationMembershipsWhereMember: [
          { role: "administrator", organizationId: mockOrganization.id },
        ],
      });

      await expect(
        OrganizationUpdater(mockOrganization, {}, ctx)
      ).resolves.toBeNull();
    });

    it("should return the updater user if `updaterId` exists", async () => {
      const updaterUser = {
        id: "user-456",
        name: "Jane Updater",
        role: "regular",
      };

      // Ensure `updaterId` is correctly set in mockOrganization
      mockOrganization.updaterId = "user-456";

      // Mock current user (authenticated user)
      const mockCurrentUser = {
        id: "user-123",
        role: "administrator",
        organizationMembershipsWhereMember: [
          { role: "administrator", organizationId: mockOrganization.id },
        ],
      };

      mocks.drizzleClient.query.usersTable.findFirst
        .mockResolvedValueOnce(mockCurrentUser) // First query: fetch current user
        .mockResolvedValueOnce(updaterUser); // Second query: fetch updater user

      const result = await OrganizationUpdater(mockOrganization, {}, ctx);

      // Ensure the result is correctly returned
      expect(result).toEqual(updaterUser);

      // Ensure both database calls were made
      expect(
        mocks.drizzleClient.query.usersTable.findFirst
      ).toHaveBeenCalledTimes(2);
    });

    it("should return the current user if they are the updater", async () => {
      // Mock organization where updaterId matches current user's ID
      const mockOrg = {
        ...mockOrganization,
        id: "org-123",
        updaterId: "user-123",
      };

      // Mock current user data
      const mockCurrentUser = {
        id: "user-123",
        role: "administrator",
        organizationMembershipsWhereMember: [
          { role: "administrator", organizationId: mockOrg.id },
        ],
      };

      mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
        mockCurrentUser
      );

      const result = await OrganizationUpdater(mockOrg, {}, ctx);

      expect(result).toEqual(mockCurrentUser);
    });
  });

  describe("Edge Cases and Unexpected Scenarios", () => {
    it("should throw an 'unexpected' error if `updaterId` exists but user does not", async () => {
      mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
        undefined
      ); 

      await expect(
        OrganizationUpdater(mockOrganization, {}, ctx)
      ).rejects.toThrow(TalawaGraphQLError);

      await expect(
        OrganizationUpdater(mockOrganization, {}, ctx)
      ).rejects.toThrow(
        new TalawaGraphQLError({ extensions: { code: "forbidden_action" } })
      );
    });
    it("should log a warning and throw an error if the updater user does not exist", async () => {
      const mockCurrentUser = {
        id: "user-123",
        role: "administrator",
        organizationMembershipsWhereMember: [
          { role: "administrator", organizationId: mockOrganization.id },
        ],
      };

      mocks.drizzleClient.query.usersTable.findFirst
        .mockResolvedValueOnce(mockCurrentUser) 
        .mockResolvedValueOnce(undefined); 

      const logWarnSpy = vi.spyOn(ctx.log, "warn"); 

      await expect(
        OrganizationUpdater(mockOrganization, {}, ctx)
      ).rejects.toThrow(
        new TalawaGraphQLError({
          extensions: { code: "unexpected" },
        })
      );

      expect(logWarnSpy).toHaveBeenCalledWith(
        "Postgres select operation returned an empty array for a organization's updater id that isn't null."
      );
    });
  });
  describe("Authentication and Authorization", () => {
    it("should throw an unauthenticated error when user is not authenticated", async () => {
      const { context: unauthenticatedCtx } = createMockGraphQLContext(false);
      await expect(
        OrganizationUpdater(mockOrganization, {}, unauthenticatedCtx)
      ).rejects.toThrow(
        new TalawaGraphQLError({ extensions: { code: "unauthenticated" } })
      );
    });

    it("should throw a forbidden_action error when user is not part of the organization", async () => {
      mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
        undefined
      );
      await expect(
        OrganizationUpdater(mockOrganization, {}, ctx)
      ).rejects.toThrow(
        new TalawaGraphQLError({ extensions: { code: "forbidden_action" } })
      );
    });
  });
});
