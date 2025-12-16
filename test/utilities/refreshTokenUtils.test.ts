import { createHash } from "node:crypto";
import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import {
	DEFAULT_REFRESH_TOKEN_EXPIRES_MS,
	findValidRefreshToken,
	generateRefreshToken,
	hashRefreshToken,
	revokeAllUserRefreshTokens,
	revokeRefreshTokenByHash,
	storeRefreshToken,
} from "~/src/utilities/refreshTokenUtils";

// Mock the drizzle client
const mockDrizzleClient = {
	insert: vi.fn(),
	update: vi.fn(),
	query: {
		refreshTokensTable: {
			findFirst: vi.fn(),
		},
	},
};

suite("refreshTokenUtils", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	suite("DEFAULT_REFRESH_TOKEN_EXPIRES_MS", () => {
		test("should be set to 7 days in milliseconds", () => {
			const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 604800000
			expect(DEFAULT_REFRESH_TOKEN_EXPIRES_MS).toBe(SEVEN_DAYS_MS);
			expect(DEFAULT_REFRESH_TOKEN_EXPIRES_MS).toBe(604_800_000);
		});
	});

	suite("generateRefreshToken", () => {
		test("should generate a 64-character hex string", () => {
			const token = generateRefreshToken();
			expect(token).toHaveLength(64);
			expect(/^[a-f0-9]+$/.test(token)).toBe(true);
		});

		test("should generate unique tokens on each call", () => {
			const token1 = generateRefreshToken();
			const token2 = generateRefreshToken();
			expect(token1).not.toBe(token2);
		});

		test("should generate cryptographically random tokens", () => {
			// Generate multiple tokens and ensure they're all unique
			const tokens = new Set<string>();
			for (let i = 0; i < 100; i++) {
				tokens.add(generateRefreshToken());
			}
			expect(tokens.size).toBe(100);
		});
	});

	suite("hashRefreshToken", () => {
		test("should return a SHA-256 hash of the token", () => {
			const token = "test-token-123";
			const hash = hashRefreshToken(token);

			// Verify it matches Node's crypto SHA-256 hash
			const expectedHash = createHash("sha256").update(token).digest("hex");
			expect(hash).toBe(expectedHash);
		});

		test("should return a 64-character hex string", () => {
			const token = "any-token";
			const hash = hashRefreshToken(token);
			expect(hash).toHaveLength(64);
			expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
		});

		test("should produce same hash for same input", () => {
			const token = "consistent-token";
			const hash1 = hashRefreshToken(token);
			const hash2 = hashRefreshToken(token);
			expect(hash1).toBe(hash2);
		});

		test("should produce different hashes for different inputs", () => {
			const hash1 = hashRefreshToken("token1");
			const hash2 = hashRefreshToken("token2");
			expect(hash1).not.toBe(hash2);
		});
	});

	suite("storeRefreshToken", () => {
		test("should insert a refresh token into the database", async () => {
			const mockResult = [{ id: "test-uuid" }];
			const mockReturning = vi.fn().mockResolvedValue(mockResult);
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
			mockDrizzleClient.insert.mockReturnValue({ values: mockValues });

			const result = await storeRefreshToken(
				mockDrizzleClient as unknown as Parameters<typeof storeRefreshToken>[0],
				"user-id-123",
				"token-hash-abc",
				new Date("2025-12-31"),
			);

			expect(mockDrizzleClient.insert).toHaveBeenCalled();
			expect(mockValues).toHaveBeenCalledWith({
				tokenHash: "token-hash-abc",
				userId: "user-id-123",
				expiresAt: new Date("2025-12-31"),
			});
			expect(result).toEqual({ id: "test-uuid" });
		});

		test("should throw an error if insertion fails", async () => {
			const mockReturning = vi.fn().mockResolvedValue([]);
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
			mockDrizzleClient.insert.mockReturnValue({ values: mockValues });

			await expect(
				storeRefreshToken(
					mockDrizzleClient as unknown as Parameters<
						typeof storeRefreshToken
					>[0],
					"user-id",
					"token-hash",
					new Date(),
				),
			).rejects.toThrow("Failed to store refresh token");
		});
	});

	suite("findValidRefreshToken", () => {
		test("should return the token if found and valid", async () => {
			const mockToken = {
				id: "token-id",
				userId: "user-id",
				expiresAt: new Date(Date.now() + 86400000), // 1 day in future
				revokedAt: null,
			};
			mockDrizzleClient.query.refreshTokensTable.findFirst.mockResolvedValue(
				mockToken,
			);

			const result = await findValidRefreshToken(
				mockDrizzleClient as unknown as Parameters<
					typeof findValidRefreshToken
				>[0],
				"token-hash",
			);

			expect(result).toEqual(mockToken);
		});

		test("should return undefined if token is not found", async () => {
			mockDrizzleClient.query.refreshTokensTable.findFirst.mockResolvedValue(
				undefined,
			);

			const result = await findValidRefreshToken(
				mockDrizzleClient as unknown as Parameters<
					typeof findValidRefreshToken
				>[0],
				"non-existent-hash",
			);

			expect(result).toBeUndefined();
		});

		test("should return undefined if token is expired", async () => {
			const mockToken = {
				id: "token-id",
				userId: "user-id",
				expiresAt: new Date(Date.now() - 86400000), // 1 day in past
				revokedAt: null,
			};
			mockDrizzleClient.query.refreshTokensTable.findFirst.mockResolvedValue(
				mockToken,
			);

			const result = await findValidRefreshToken(
				mockDrizzleClient as unknown as Parameters<
					typeof findValidRefreshToken
				>[0],
				"expired-token-hash",
			);

			expect(result).toBeUndefined();
		});

		test("should return undefined if token is revoked", async () => {
			const mockToken = {
				id: "token-id",
				userId: "user-id",
				expiresAt: new Date(Date.now() + 86400000), // 1 day in future
				revokedAt: new Date(), // Already revoked
			};
			mockDrizzleClient.query.refreshTokensTable.findFirst.mockResolvedValue(
				mockToken,
			);

			const result = await findValidRefreshToken(
				mockDrizzleClient as unknown as Parameters<
					typeof findValidRefreshToken
				>[0],
				"revoked-token-hash",
			);

			expect(result).toBeUndefined();
		});
	});

	suite("revokeRefreshTokenByHash", () => {
		test("should return true when token is revoked successfully", async () => {
			const mockResult = [{ id: "token-id" }];
			const mockReturning = vi.fn().mockResolvedValue(mockResult);
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.update.mockReturnValue({ set: mockSet });

			const result = await revokeRefreshTokenByHash(
				mockDrizzleClient as unknown as Parameters<
					typeof revokeRefreshTokenByHash
				>[0],
				"token-hash",
			);

			expect(result).toBe(true);
		});

		test("should return false when token is not found", async () => {
			const mockReturning = vi.fn().mockResolvedValue([]);
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.update.mockReturnValue({ set: mockSet });

			const result = await revokeRefreshTokenByHash(
				mockDrizzleClient as unknown as Parameters<
					typeof revokeRefreshTokenByHash
				>[0],
				"non-existent-hash",
			);

			expect(result).toBe(false);
		});
	});

	suite("revokeAllUserRefreshTokens", () => {
		test("should return the number of tokens revoked", async () => {
			const mockResult = [{ id: "token-1" }, { id: "token-2" }];
			const mockReturning = vi.fn().mockResolvedValue(mockResult);
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.update.mockReturnValue({ set: mockSet });

			const result = await revokeAllUserRefreshTokens(
				mockDrizzleClient as unknown as Parameters<
					typeof revokeAllUserRefreshTokens
				>[0],
				"user-id",
			);

			expect(result).toBe(2);
		});

		test("should return 0 when no tokens to revoke", async () => {
			const mockReturning = vi.fn().mockResolvedValue([]);
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.update.mockReturnValue({ set: mockSet });

			const result = await revokeAllUserRefreshTokens(
				mockDrizzleClient as unknown as Parameters<
					typeof revokeAllUserRefreshTokens
				>[0],
				"user-with-no-tokens",
			);

			expect(result).toBe(0);
		});
	});
});
