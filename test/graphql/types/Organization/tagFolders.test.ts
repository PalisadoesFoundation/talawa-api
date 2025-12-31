import { describe, it, expect, vi } from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * We capture the resolver function from Organization.tagFolders
 * by mocking the Organization type builder.
 */
let capturedResolver: any;

/**
 * Mock Organization type BEFORE importing tagFolders
 */
vi.mock("~/src/graphql/types/Organization/Organization", () => {
  return {
    Organization: {
      implement: ({ fields }: any) => {
        const fakeBuilder = {
          connection: (config: any) => {
            capturedResolver = config.resolve;
            return {};
          },
        };

        fields(fakeBuilder);
      },
    },
  };
});

/**
 * Import AFTER mock so resolver is registered
 */
import "~/src/graphql/types/Organization/tagFolders";

describe("Organization.tagFolders resolver", () => {
  const organization = { id: "org-1" };

  it("throws unauthenticated error when user is not authenticated", async () => {
    const ctx = {
      currentClient: {
        isAuthenticated: false,
      },
    };

    await expect(
      capturedResolver(organization, {}, ctx),
    ).rejects.toBeInstanceOf(TalawaGraphQLError);
  });

  it("throws error when authenticated user is not admin", async () => {
    const ctx = {
      currentClient: {
        isAuthenticated: true,
        isAdmin: false,
      },
    };

    await expect(
      capturedResolver(organization, {}, ctx),
    ).rejects.toBeInstanceOf(TalawaGraphQLError);
  });

  it("returns empty connection when no tag folders exist", async () => {
    const ctx = {
      currentClient: {
        isAuthenticated: true,
        isAdmin: true,
      },
    };

    const result = await capturedResolver(organization, {}, ctx);

    expect(result).toBeDefined();
    expect(result.edges).toEqual([]);
  });

  it("throws error for invalid cursor argument", async () => {
    const ctx = {
      currentClient: {
        isAuthenticated: true,
        isAdmin: true,
      },
    };

    await expect(
      capturedResolver(
        organization,
        { after: "invalid-cursor" },
        ctx,
      ),
    ).rejects.toBeInstanceOf(TalawaGraphQLError);
  });

  it("throws error when both first and last are provided", async () => {
    const ctx = {
      currentClient: {
        isAuthenticated: true,
        isAdmin: true,
      },
    };

    await expect(
      capturedResolver(
        organization,
        { first: 10, last: 10 },
        ctx,
      ),
    ).rejects.toBeInstanceOf(TalawaGraphQLError);
  });
});
