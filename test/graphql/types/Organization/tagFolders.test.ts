import { describe, it, expect, vi } from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

let capturedResolver: any;

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


import "~/src/graphql/types/Organization/tagFolders";

describe("Organization.tagFolders", () => {
	it("throws unauthenticated error when user is not authenticated", async () => {
		const organization = { id: "org-1" };

		const ctx = {
			currentClient: {
				isAuthenticated: false,
			},
		};

		await expect(
			capturedResolver(organization, {}, ctx),
		).rejects.toBeInstanceOf(TalawaGraphQLError);
	});
});
