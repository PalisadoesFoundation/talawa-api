import { afterEach, expect, suite, test, vi } from "vitest";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import {
	isRefreshTokenValid,
	persistRefreshToken,
	revokeRefreshToken,
	sha256,
} from "~/src/services/auth/refreshStore";

const mockDb: {
	insert: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
	query: { refreshTokensTable: { findFirst: ReturnType<typeof vi.fn> } };
} = {
	insert: vi.fn(),
	update: vi.fn(),
	query: {
		refreshTokensTable: {
			findFirst: vi.fn(),
		},
	},
};

const FIXED_NOW = new Date("2025-06-15T12:00:00.000Z");

/**
 * Mocks findFirst to resolve with the given returnValue.
 * Production code passes an SQL expression object (and(...)) for where, not a callback,
 * so where-clause behavior is not exercised by this mock; these tests document outcomes only.
 */
function mockFindFirst<T>(returnValue: T): void {
	mockDb.query.refreshTokensTable.findFirst.mockResolvedValue(returnValue);
}

suite("refreshStore", () => {
	afterEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	suite("sha256", () => {
		test("returns consistent hex hash for same input and different hashes for different inputs", () => {
			expect(sha256("t1")).toBe(sha256("t1"));
			expect(sha256("t1")).toHaveLength(64);
			expect(/^[a-f0-9]+$/.test(sha256("t1"))).toBe(true);
			expect(sha256("t1")).not.toBe(sha256("t2"));
		});
	});

	suite("persistRefreshToken", () => {
		test("inserts with userId, tokenHash (SHA256 of token), and expiresAt", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(FIXED_NOW);

			const mockValues = vi.fn().mockResolvedValue(undefined);
			mockDb.insert.mockReturnValue({ values: mockValues });

			const ttlSec = 3600;
			await persistRefreshToken(mockDb as unknown as DrizzleClient, {
				token: "t1",
				userId: "u1",
				ttlSec,
			});

			expect(mockDb.insert).toHaveBeenCalledTimes(1);
			expect(mockValues).toHaveBeenCalledTimes(1);
			const callArgs = mockValues.mock.calls[0];
			expect(callArgs).toBeDefined();
			const valuesArg = callArgs?.[0];
			expect(valuesArg).toBeDefined();
			expect(valuesArg).toMatchObject({
				userId: "u1",
				tokenHash: sha256("t1"),
			});
			const expectedExpiresAt = new Date(FIXED_NOW.getTime() + ttlSec * 1000);
			const expiresAt = (valuesArg as { expiresAt: Date }).expiresAt;
			expect(expiresAt.getTime()).toBe(expectedExpiresAt.getTime());
		});

		test("throws when ttlSec is not positive", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(FIXED_NOW);

			await expect(
				persistRefreshToken(mockDb as unknown as DrizzleClient, {
					token: "t1",
					userId: "u1",
					ttlSec: 0,
				}),
			).rejects.toThrow(/params\.ttlSec must be positive/);

			await expect(
				persistRefreshToken(mockDb as unknown as DrizzleClient, {
					token: "t1",
					userId: "u1",
					ttlSec: -1,
				}),
			).rejects.toThrow(/params\.ttlSec must be positive/);

			await expect(
				persistRefreshToken(mockDb as unknown as DrizzleClient, {
					token: "t1",
					userId: "u1",
					ttlSec: Number.NaN,
				}),
			).rejects.toThrow(/params\.ttlSec must be positive/);

			expect(mockDb.insert).not.toHaveBeenCalled();
		});

		test("accepts optional ip and userAgent without persisting them", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(FIXED_NOW);

			const mockValues = vi.fn().mockResolvedValue(undefined);
			mockDb.insert.mockReturnValue({ values: mockValues });

			await persistRefreshToken(mockDb as unknown as DrizzleClient, {
				token: "t1",
				userId: "u1",
				ttlSec: 3600,
				ip: "1.2.3.4",
				userAgent: "Mozilla/5.0",
			});

			const callArgs = mockValues.mock.calls[0];
			expect(callArgs).toBeDefined();
			const valuesArg = callArgs?.[0];
			expect(valuesArg).not.toHaveProperty("ip");
			expect(valuesArg).not.toHaveProperty("userAgent");
			expect(valuesArg).toMatchObject({
				userId: "u1",
				tokenHash: sha256("t1"),
			});
		});
	});

	suite("isRefreshTokenValid", () => {
		test("returns true when row exists, not revoked, not expired", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(FIXED_NOW);

			const validRow = {
				userId: "u1",
				tokenHash: sha256("t1"),
				revokedAt: null,
				expiresAt: new Date(FIXED_NOW.getTime() + 60_000),
			};
			mockFindFirst(validRow);

			const result = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);

			expect(result).toBe(true);
		});

		test("returns false when token is revoked", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(FIXED_NOW);

			// Revoked/expired filtering is in the SQL WHERE (isNull(revokedAt), gt(expiresAt, now)),
			// not in application logic, so we intentionally mock mockFindFirst to return undefined
			// and exercise the same code path in isRefreshTokenValid; this documents the revoked scenario.
			mockFindFirst(undefined);

			const result = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);

			expect(result).toBe(false);
		});

		test("returns false when token is expired", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(FIXED_NOW);

			// Revoked/expired filtering is in the SQL WHERE (isNull(revokedAt), gt(expiresAt, now)),
			// not in application logic, so we intentionally mock mockFindFirst to return undefined
			// and exercise the same code path in isRefreshTokenValid; this documents the expired scenario.
			mockFindFirst(undefined);

			const result = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);

			expect(result).toBe(false);
		});

		test("returns false when token is not found", async () => {
			mockFindFirst(undefined);

			const result = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);

			expect(result).toBe(false);
		});

		test("returns false when expiresAt is exactly now (boundary)", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(FIXED_NOW);

			// Query uses gt(expiresAt, now), so expiresAt === now returns no row.
			mockFindFirst(undefined);

			const result = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);

			expect(result).toBe(false);
		});
	});

	suite("revokeRefreshToken", () => {
		test("calls update with set revokedAt and where tokenHash equals sha256(token), returns true when row updated", async () => {
			const mockReturning = vi.fn().mockResolvedValue([{ id: "id-1" }]);
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDb.update.mockReturnValue({ set: mockSet });

			const result = await revokeRefreshToken(
				mockDb as unknown as DrizzleClient,
				"t1",
			);

			expect(result).toBe(true);
			expect(mockDb.update).toHaveBeenCalledTimes(1);
			expect(mockSet).toHaveBeenCalledTimes(1);
			const setCallArgs = mockSet.mock.calls[0];
			expect(setCallArgs).toBeDefined();
			const setArg = setCallArgs?.[0] as { revokedAt: Date } | undefined;
			expect(setArg).toBeDefined();
			expect(setArg).toHaveProperty("revokedAt");
			expect(setArg?.revokedAt).toBeInstanceOf(Date);
			expect(mockWhere).toHaveBeenCalledTimes(1);
			// The where predicate is eq(refreshTokensTable.tokenHash, sha256("t1")).
			// Drizzle returns an opaque SQL expression object; exact equality is not asserted here
			// and should be covered by integration tests. We only verify where() was invoked with one argument.
			const whereCallArgs = mockWhere.mock.calls[0];
			expect(whereCallArgs).toBeDefined();
			expect(whereCallArgs?.length).toBe(1);
			expect(whereCallArgs?.[0]).toBeTruthy();
		});

		test("returns false when no row matches token", async () => {
			const mockReturning = vi.fn().mockResolvedValue([]);
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDb.update.mockReturnValue({ set: mockSet });

			const result = await revokeRefreshToken(
				mockDb as unknown as DrizzleClient,
				"unknown-token",
			);

			expect(result).toBe(false);
		});
	});

	suite("persist then isValid; revoke then isValid false", () => {
		test("persisted token is valid; after revoke, isValid returns false", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(FIXED_NOW);

			const mockValues = vi.fn().mockResolvedValue(undefined);
			mockDb.insert.mockReturnValue({ values: mockValues });
			const mockReturning = vi.fn().mockResolvedValue([{ id: "id-1" }]);
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDb.update.mockReturnValue({ set: mockSet });

			await persistRefreshToken(mockDb as unknown as DrizzleClient, {
				token: "t1",
				userId: "u1",
				ttlSec: 3600,
			});
			expect(mockDb.insert).toHaveBeenCalled();

			const storedRow = {
				userId: "u1",
				tokenHash: sha256("t1"),
				revokedAt: null,
				expiresAt: new Date(FIXED_NOW.getTime() + 60_000),
			};
			mockFindFirst(storedRow);

			const validBefore = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);
			expect(validBefore).toBe(true);

			const revoked = await revokeRefreshToken(
				mockDb as unknown as DrizzleClient,
				"t1",
			);
			expect(revoked).toBe(true);
			expect(mockDb.update).toHaveBeenCalled();

			// After revoke, query (isNull(revokedAt), gt(expiresAt, now)) returns no row.
			mockFindFirst(undefined);

			const validAfter = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);
			expect(validAfter).toBe(false);
		});
	});
});
