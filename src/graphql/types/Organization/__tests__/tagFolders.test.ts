import { describe, it, expect, vi } from "vitest";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";


let capturedResolver: (
	parent: { id: string },
	args: Record<string, unknown>,
	ctx: { currentClient: { isAuthenticated: boolean; userId?: string } }
) => Promise<unknown>;


vi.mock("~/src/graphql/types/Organization/Organization", () => {
	return {
		Organization: {
			implement: (
				input: {
					fields: (t: {
						connection: (config: {
							resolve: typeof capturedResolver;
						}) => unknown;
					}) => void;
				},
			) => {
				const fakeT = {
					connection: (config: {
						resolve: typeof capturedResolver;
					}) => {
						capturedResolver = config.resolve;
						return {};
					},
				};

				input.fields(fakeT);
			},
		},
	};
});

// Import AFTER mock
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

	it("throws error when cursor is invalid", async () => {
		const organization = { id: "org-1" };

		const ctx = {
			currentClient: {
				isAuthenticated: true,
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

	it("throws error when user is not authorized", async () => {
		const organization = { id: "org-1" };

		const ctx = {
			currentClient: {
				isAuthenticated: true,
				userId: "user-1",
			},
		};

		await expect(
			capturedResolver(organization, {}, ctx),
		).rejects.toBeInstanceOf(TalawaGraphQLError);
	});

	it("throws error when user is not found", async () => {
		const organization = { id: "org-1" };

		const ctx = {
			currentClient: {
				isAuthenticated: true,
				userId: "non-existing-user",
			},
		};

		await expect(
			capturedResolver(organization, {}, ctx),
		).rejects.toBeInstanceOf(TalawaGraphQLError);
	});

	it("throws error on invalid pagination arguments", async () => {
		const organization = { id: "org-1" };

		const ctx = {
			currentClient: {
				isAuthenticated: true,
			},
		};

		await expect(
			capturedResolver(
				organization,
				{ first: -1 },
				ctx,
			),
		).rejects.toBeInstanceOf(TalawaGraphQLError);
	});
});
