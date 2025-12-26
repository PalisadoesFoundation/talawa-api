import { createHash } from "node:crypto";
import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import {
	DEFAULT_USER_PASSWORD_RESET_TOKEN_EXPIRES_SECONDS,
	findValidPasswordResetToken,
	generatePasswordResetToken,
	hashPasswordResetToken,
	markPasswordResetTokenAsUsed,
	revokeAllUserPasswordResetTokens,
	storePasswordResetToken,
} from "~/src/utilities/passwordResetTokenUtils";

// Mock the drizzle client
const mockDrizzleClient = {
	insert: vi.fn(),
	update: vi.fn(),
	select: vi.fn(),
};

suite("passwordResetTokenUtils", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	suite("DEFAULT_USER_PASSWORD_RESET_TOKEN_EXPIRES_SECONDS", () => {
		test("should be set to 14 days in seconds", () => {
			const FOURTEEN_DAYS_SECONDS = 14 * 24 * 60 * 60; // 1209600
			expect(DEFAULT_USER_PASSWORD_RESET_TOKEN_EXPIRES_SECONDS).toBe(
				FOURTEEN_DAYS_SECONDS,
			);
			expect(DEFAULT_USER_PASSWORD_RESET_TOKEN_EXPIRES_SECONDS).toBe(1_209_600);
		});
	});

	suite("generatePasswordResetToken", () => {
		test("should generate a 64-character hex string", () => {
			const token = generatePasswordResetToken();
			expect(token).toHaveLength(64);
			expect(/^[a-f0-9]+$/.test(token)).toBe(true);
		});

		test("should generate unique tokens on each call", () => {
			const token1 = generatePasswordResetToken();
			const token2 = generatePasswordResetToken();
			expect(token1).not.toBe(token2);
		});

		test("should generate cryptographically random tokens", () => {
			// Generate multiple tokens and ensure they're all unique
			const tokens = new Set<string>();
			for (let i = 0; i < 100; i++) {
				tokens.add(generatePasswordResetToken());
			}
			expect(tokens.size).toBe(100);
		});
	});

	suite("hashPasswordResetToken", () => {
		test("should return a SHA-256 hash of the token", () => {
			const token = "test-token-123";
			const hash = hashPasswordResetToken(token);

			// Verify it matches Node's crypto SHA-256 hash
			const expectedHash = createHash("sha256").update(token).digest("hex");
			expect(hash).toBe(expectedHash);
		});

		test("should return a 64-character hex string", () => {
			const token = "any-token";
			const hash = hashPasswordResetToken(token);
			expect(hash).toHaveLength(64);
			expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
		});

		test("should produce same hash for same input", () => {
			const token = "consistent-token";
			const hash1 = hashPasswordResetToken(token);
			const hash2 = hashPasswordResetToken(token);
			expect(hash1).toBe(hash2);
		});

		test("should produce different hashes for different inputs", () => {
			const hash1 = hashPasswordResetToken("token1");
			const hash2 = hashPasswordResetToken("token2");
			expect(hash1).not.toBe(hash2);
		});
	});

	suite("storePasswordResetToken", () => {
		test("should insert a password reset token into the database", async () => {
			const mockResult = [{ id: "test-uuid" }];
			const mockReturning = vi.fn().mockResolvedValue(mockResult);
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
			mockDrizzleClient.insert.mockReturnValue({ values: mockValues });

			const result = await storePasswordResetToken(
				mockDrizzleClient as unknown as Parameters<
					typeof storePasswordResetToken
				>[0],
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
				storePasswordResetToken(
					mockDrizzleClient as unknown as Parameters<
						typeof storePasswordResetToken
					>[0],
					"user-id",
					"token-hash",
					new Date(),
				),
			).rejects.toThrow("Failed to store password reset token");
		});
	});

	suite("findValidPasswordResetToken", () => {
		test("should return the token if found and valid", async () => {
			const mockToken = {
				id: "token-id",
				userId: "user-id",
				expiresAt: new Date(Date.now() + 86400000), // 1 day in future
				usedAt: null,
			};
			// Create a promise-like mock chain - return array since code uses .then(results => results[0])
			const mockLimit = vi.fn().mockReturnValue(Promise.resolve([mockToken]));
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.select.mockReturnValue({ from: mockFrom });

			const result = await findValidPasswordResetToken(
				mockDrizzleClient as unknown as Parameters<
					typeof findValidPasswordResetToken
				>[0],
				"token-hash",
			);

			expect(result).toEqual(mockToken);
		});

		test("should return undefined if token is not found", async () => {
			// Return empty array for not found case
			const mockLimit = vi.fn().mockReturnValue(Promise.resolve([]));
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.select.mockReturnValue({ from: mockFrom });

			const result = await findValidPasswordResetToken(
				mockDrizzleClient as unknown as Parameters<
					typeof findValidPasswordResetToken
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
				usedAt: null,
			};
			// Return array with token - expiry check happens in application code
			const mockLimit = vi.fn().mockReturnValue(Promise.resolve([mockToken]));
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.select.mockReturnValue({ from: mockFrom });

			const result = await findValidPasswordResetToken(
				mockDrizzleClient as unknown as Parameters<
					typeof findValidPasswordResetToken
				>[0],
				"expired-token-hash",
			);

			expect(result).toBeUndefined();
		});
	});

	suite("markPasswordResetTokenAsUsed", () => {
		test("should return true when token is marked as used successfully", async () => {
			const mockResult = [{ id: "token-id" }];
			const mockReturning = vi.fn().mockResolvedValue(mockResult);
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.update.mockReturnValue({ set: mockSet });

			const result = await markPasswordResetTokenAsUsed(
				mockDrizzleClient as unknown as Parameters<
					typeof markPasswordResetTokenAsUsed
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

			const result = await markPasswordResetTokenAsUsed(
				mockDrizzleClient as unknown as Parameters<
					typeof markPasswordResetTokenAsUsed
				>[0],
				"non-existent-hash",
			);

			expect(result).toBe(false);
		});
	});

	suite("revokeAllUserPasswordResetTokens", () => {
		test("should return the number of tokens revoked", async () => {
			const mockResult = [{ id: "token-1" }, { id: "token-2" }];
			const mockReturning = vi.fn().mockResolvedValue(mockResult);
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.update.mockReturnValue({ set: mockSet });

			const result = await revokeAllUserPasswordResetTokens(
				mockDrizzleClient as unknown as Parameters<
					typeof revokeAllUserPasswordResetTokens
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

			const result = await revokeAllUserPasswordResetTokens(
				mockDrizzleClient as unknown as Parameters<
					typeof revokeAllUserPasswordResetTokens
				>[0],
				"user-with-no-tokens",
			);

			expect(result).toBe(0);
		});
	});
});
