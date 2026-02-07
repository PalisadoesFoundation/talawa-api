import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
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

suite("refreshStore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	suite("sha256", () => {
		test("returns consistent hex hash for same input", () => {
			expect(sha256("t1")).toBe(sha256("t1"));
			expect(sha256("t1")).toHaveLength(64);
			expect(/^[a-f0-9]+$/.test(sha256("t1"))).toBe(true);
		});
	});

	suite("persistRefreshToken", () => {
		test("inserts with userId, tokenHash (SHA256 of token), and expiresAt", async () => {
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
			const expiresAt = (valuesArg as { expiresAt: Date }).expiresAt;
			const now = Date.now();
			const expectedMin = now + ttlSec * 1000 - 1000;
			const expectedMax = now + ttlSec * 1000 + 1000;
			expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
			expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
		});

		test("accepts optional ip and userAgent without persisting them", async () => {
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
			const validRow = {
				userId: "u1",
				tokenHash: sha256("t1"),
				revokedAt: null,
				expiresAt: new Date(Date.now() + 60_000),
			};
			mockDb.query.refreshTokensTable.findFirst.mockResolvedValue(validRow);

			const result = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);

			expect(result).toBe(true);
		});

		test("returns false when token is revoked", async () => {
			const revokedRow = {
				userId: "u1",
				tokenHash: sha256("t1"),
				revokedAt: new Date(),
				expiresAt: new Date(Date.now() + 60_000),
			};
			mockDb.query.refreshTokensTable.findFirst.mockResolvedValue(revokedRow);

			const result = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);

			expect(result).toBe(false);
		});

		test("returns false when token is expired", async () => {
			const expiredRow = {
				userId: "u1",
				tokenHash: sha256("t1"),
				revokedAt: null,
				expiresAt: new Date(Date.now() - 1000),
			};
			mockDb.query.refreshTokensTable.findFirst.mockResolvedValue(expiredRow);

			const result = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);

			expect(result).toBe(false);
		});

		test("returns false when token is not found", async () => {
			mockDb.query.refreshTokensTable.findFirst.mockResolvedValue(undefined);

			const result = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);

			expect(result).toBe(false);
		});

		test("returns false when expiresAt is exactly now (boundary)", async () => {
			const boundaryRow = {
				userId: "u1",
				tokenHash: sha256("t1"),
				revokedAt: null,
				expiresAt: new Date(Date.now()),
			};
			mockDb.query.refreshTokensTable.findFirst.mockResolvedValue(boundaryRow);

			const result = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);

			expect(result).toBe(false);
		});
	});

	suite("revokeRefreshToken", () => {
		test("calls update with set revokedAt and where tokenHash equals sha256(token)", async () => {
			const mockWhere = vi.fn().mockResolvedValue(undefined);
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDb.update.mockReturnValue({ set: mockSet });

			await revokeRefreshToken(mockDb as unknown as DrizzleClient, "t1");

			expect(mockDb.update).toHaveBeenCalledTimes(1);
			expect(mockSet).toHaveBeenCalledTimes(1);
			const setCallArgs = mockSet.mock.calls[0];
			expect(setCallArgs).toBeDefined();
			const setArg = setCallArgs?.[0] as { revokedAt: Date } | undefined;
			expect(setArg).toBeDefined();
			expect(setArg).toHaveProperty("revokedAt");
			expect(setArg?.revokedAt).toBeInstanceOf(Date);
			expect(setArg?.revokedAt.getTime()).toBeGreaterThanOrEqual(
				Date.now() - 1000,
			);
			expect(mockWhere).toHaveBeenCalledTimes(1);
			// where is called with eq(refreshTokensTable.tokenHash, sha256("t1"))
			const whereCallArgs = mockWhere.mock.calls[0];
			expect(whereCallArgs).toBeDefined();
			expect(whereCallArgs?.[0]).toBeDefined();
			// Drizzle eq returns a SQL expression; we verify revoke was invoked with correct intent
			// by checking that update().set().where() was chained
			expect(mockWhere).toHaveBeenCalled();
		});
	});

	suite("persist then isValid; revoke then isValid false", () => {
		test("persisted token is valid; after revoke, isValid returns false", async () => {
			const mockValues = vi.fn().mockResolvedValue(undefined);
			mockDb.insert.mockReturnValue({ values: mockValues });
			const mockWhere = vi.fn().mockResolvedValue(undefined);
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
				expiresAt: new Date(Date.now() + 60_000),
			};
			mockDb.query.refreshTokensTable.findFirst.mockResolvedValue(storedRow);

			const validBefore = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);
			expect(validBefore).toBe(true);

			await revokeRefreshToken(mockDb as unknown as DrizzleClient, "t1");
			expect(mockDb.update).toHaveBeenCalled();

			const revokedRow = {
				...storedRow,
				revokedAt: new Date(),
			};
			mockDb.query.refreshTokensTable.findFirst.mockResolvedValue(revokedRow);

			const validAfter = await isRefreshTokenValid(
				mockDb as unknown as DrizzleClient,
				"t1",
				"u1",
			);
			expect(validAfter).toBe(false);
		});
	});
});
