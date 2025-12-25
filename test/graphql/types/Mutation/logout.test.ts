import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
	hashRefreshToken,
	revokeAllUserRefreshTokens,
	revokeRefreshTokenByHash,
} from "~/src/utilities/refreshTokenUtils";

// Mock dependencies
vi.mock("~/src/utilities/refreshTokenUtils", () => ({
	hashRefreshToken: vi.fn(),
	revokeAllUserRefreshTokens: vi.fn(),
	revokeRefreshTokenByHash: vi.fn(),
}));

// Use vi.hoisted to create the mock function so it can be used in vi.mock
const { mockField } = vi.hoisted(() => ({
	mockField: vi.fn(),
}));

vi.mock("~/src/graphql/builder", () => ({
	builder: {
		objectRef: vi.fn().mockReturnValue({
			implement: vi.fn(),
		}),
		mutationField: vi.fn((_name, cb) => {
			const t = {
				field: mockField,
				exposeBoolean: vi.fn(),
			};
			cb(t);
		}),
	},
}));

import "~/src/graphql/types/Mutation/logout";

describe("Logout Mutation", () => {
	it("should register logout mutation", () => {
		expect(mockField).toHaveBeenCalledWith(
			expect.objectContaining({
				description:
					"Mutation to log out the current user. Clears authentication cookies and revokes refresh tokens.",
				type: expect.anything(),
			}),
		);
	});

	describe("resolve", () => {
		let resolve: (...args: unknown[]) => Promise<unknown>;

		beforeAll(() => {
			if (!mockField.mock.calls[0]) {
				throw new Error(
					"Logout mutation was not registered. mockField.mock.calls[0] is undefined.",
				);
			}
			// Extract the resolve function from the mock call
			resolve = mockField.mock.calls[0][0].resolve;
		});

		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("should revoke all tokens for authenticated user", async () => {
			const ctx = {
				currentClient: {
					isAuthenticated: true,
					user: { id: "user-123" },
				},
				drizzleClient: {},
				cookie: {
					clearAuthCookies: vi.fn(),
				},
			};

			const result = await resolve(null, null, ctx);

			expect(revokeAllUserRefreshTokens).toHaveBeenCalledWith(
				ctx.drizzleClient,
				"user-123",
			);
			expect(ctx.cookie.clearAuthCookies).toHaveBeenCalled();
			expect(result).toEqual({ success: true });
		});

		it("should revoke specific token for unauthenticated user with cookie", async () => {
			const ctx = {
				currentClient: {
					isAuthenticated: false,
				},
				drizzleClient: {},
				cookie: {
					getRefreshToken: vi.fn().mockReturnValue("refresh-token"),
					clearAuthCookies: vi.fn(),
				},
			};

			vi.mocked(hashRefreshToken).mockReturnValue("hashed-token");

			const result = await resolve(null, null, ctx);

			expect(revokeAllUserRefreshTokens).not.toHaveBeenCalled();
			expect(hashRefreshToken).toHaveBeenCalledWith("refresh-token");
			expect(revokeRefreshTokenByHash).toHaveBeenCalledWith(
				ctx.drizzleClient,
				"hashed-token",
			);
			expect(ctx.cookie.clearAuthCookies).toHaveBeenCalled();
			expect(result).toEqual({ success: true });
		});

		it("should do nothing if unauthenticated and no cookie", async () => {
			const ctx = {
				currentClient: {
					isAuthenticated: false,
				},
				drizzleClient: {},
				cookie: {
					getRefreshToken: vi.fn().mockReturnValue(undefined),
					clearAuthCookies: vi.fn(),
				},
			};

			const result = await resolve(null, null, ctx);

			expect(revokeAllUserRefreshTokens).not.toHaveBeenCalled();
			expect(revokeRefreshTokenByHash).not.toHaveBeenCalled();
			expect(ctx.cookie.clearAuthCookies).toHaveBeenCalled();
			expect(result).toEqual({ success: true });
		});

		it("should handle missing cookie helper", async () => {
			const ctx = {
				currentClient: {
					isAuthenticated: true,
					user: { id: "user-123" },
				},
				drizzleClient: {},
				// No cookie helper (e.g. subscription or non-http)
			};

			const result = await resolve(null, null, ctx);

			expect(revokeAllUserRefreshTokens).toHaveBeenCalledWith(
				ctx.drizzleClient,
				"user-123",
			);
			expect(result).toEqual({ success: true });
		});
	});
});
