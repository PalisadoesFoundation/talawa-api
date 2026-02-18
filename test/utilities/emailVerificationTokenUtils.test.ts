import { createHmac } from "node:crypto";
import { envSchema } from "env-schema";
import { type Static, Type } from "typebox";
import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import { envConfigSchema, envSchemaAjv } from "~/src/envConfigSchema";
import {
	DEFAULT_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS,
	findValidEmailVerificationToken,
	generateEmailVerificationToken,
	hashEmailVerificationToken,
	markEmailVerificationTokenAsUsed,
	revokeAllUserEmailVerificationTokens,
	storeEmailVerificationToken,
} from "~/src/utilities/emailVerificationTokenUtils";

// Load HMAC secret from environment (same logic as implementation)
const hmacEnvSchema = Type.Pick(envConfigSchema, [
	"API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET",
]);

const hmacEnvConfig = envSchema<Static<typeof hmacEnvSchema>>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema: hmacEnvSchema,
});

// Mock the drizzle client
const mockDrizzleClient = {
	insert: vi.fn(),
	update: vi.fn(),
	select: vi.fn(),
};

suite("emailVerificationTokenUtils", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	suite("DEFAULT_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS", () => {
		test("should be set to 24 hours in seconds", () => {
			const TWENTY_FOUR_HOURS_SECONDS = 24 * 60 * 60; // 86400
			expect(DEFAULT_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS).toBe(
				TWENTY_FOUR_HOURS_SECONDS,
			);
			expect(DEFAULT_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS).toBe(86_400);
		});
	});

	suite("generateEmailVerificationToken", () => {
		test("should generate a 64-character hex string", () => {
			const token = generateEmailVerificationToken();
			expect(token).toHaveLength(64);
			expect(/^[a-f0-9]+$/.test(token)).toBe(true);
		});

		test("should generate unique tokens on each call", () => {
			const token1 = generateEmailVerificationToken();
			const token2 = generateEmailVerificationToken();
			expect(token1).not.toBe(token2);
		});

		test("should generate cryptographically random tokens", () => {
			// Generate multiple tokens and ensure they're all unique
			const tokens = new Set<string>();
			for (let i = 0; i < 100; i++) {
				tokens.add(generateEmailVerificationToken());
			}
			expect(tokens.size).toBe(100);
		});
	});

	suite("hashEmailVerificationToken", () => {
		test("should return a HMAC-SHA-256 hash of the token", () => {
			const token = "test-token-123";
			const hash = hashEmailVerificationToken(token);

			// Verify it matches Node's crypto HMAC-SHA-256 hash with the resolved key
			const expectedHash = createHmac(
				"sha256",
				hmacEnvConfig.API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET as string,
			)
				.update(token)
				.digest("hex");
			expect(hash).toBe(expectedHash);
		});

		test("should return a 64-character hex string", () => {
			const token = "any-token";
			const hash = hashEmailVerificationToken(token);
			expect(hash).toHaveLength(64);
			expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
		});

		test("should produce same hash for same input", () => {
			const token = "consistent-token";
			const hash1 = hashEmailVerificationToken(token);
			const hash2 = hashEmailVerificationToken(token);
			expect(hash1).toBe(hash2);
		});

		test("should produce different hashes for different inputs", () => {
			const hash1 = hashEmailVerificationToken("token1");
			const hash2 = hashEmailVerificationToken("token2");
			expect(hash1).not.toBe(hash2);
		});

		test("should be collision-resistant for slightly different inputs", () => {
			// Test that even small changes produce completely different hashes
			const hash1 = hashEmailVerificationToken("token123");
			const hash2 = hashEmailVerificationToken("token124");
			expect(hash1).not.toBe(hash2);
			// Verify hashes don't share any common prefix (avalanche effect)
			expect(hash1.substring(0, 8)).not.toBe(hash2.substring(0, 8));
		});

		test("should work correctly with generated tokens", () => {
			// Verify integration with generateEmailVerificationToken
			const token = generateEmailVerificationToken();
			const hash = hashEmailVerificationToken(token);
			expect(hash).toHaveLength(64);
			expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
			// Hash should be deterministic
			expect(hashEmailVerificationToken(token)).toBe(hash);
		});
	});

	suite("storeEmailVerificationToken", () => {
		test("should insert an email verification token into the database", async () => {
			const mockResult = [{ id: "test-uuid" }];
			const mockReturning = vi.fn().mockResolvedValue(mockResult);
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
			mockDrizzleClient.insert.mockReturnValue({ values: mockValues });

			const result = await storeEmailVerificationToken(
				mockDrizzleClient as unknown as Parameters<
					typeof storeEmailVerificationToken
				>[0],
				"user-id-123",
				"token-hash-abc",
				new Date("2026-01-15"),
			);

			expect(mockDrizzleClient.insert).toHaveBeenCalled();
			expect(mockValues).toHaveBeenCalledWith({
				tokenHash: "token-hash-abc",
				userId: "user-id-123",
				expiresAt: new Date("2026-01-15"),
			});
			expect(result).toEqual({ id: "test-uuid" });
		});

		test("should throw an error if insertion fails", async () => {
			const mockReturning = vi.fn().mockResolvedValue([]);
			const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
			mockDrizzleClient.insert.mockReturnValue({ values: mockValues });

			await expect(
				storeEmailVerificationToken(
					mockDrizzleClient as unknown as Parameters<
						typeof storeEmailVerificationToken
					>[0],
					"user-id",
					"token-hash",
					new Date(),
				),
			).rejects.toThrow("Failed to store email verification token");
		});
	});

	suite("findValidEmailVerificationToken", () => {
		test("should return the token if found and valid", async () => {
			const mockToken = {
				id: "token-id",
				userId: "user-id",
				expiresAt: new Date(Date.now() + 86400000), // 1 day in future
				usedAt: null,
			};
			const mockLimit = vi.fn().mockReturnValue(Promise.resolve([mockToken]));
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.select.mockReturnValue({ from: mockFrom });

			const result = await findValidEmailVerificationToken(
				mockDrizzleClient as unknown as Parameters<
					typeof findValidEmailVerificationToken
				>[0],
				"token-hash",
			);

			expect(result).toEqual(mockToken);
		});

		test("should return undefined if token is not found", async () => {
			const mockLimit = vi.fn().mockReturnValue(Promise.resolve([]));
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.select.mockReturnValue({ from: mockFrom });

			const result = await findValidEmailVerificationToken(
				mockDrizzleClient as unknown as Parameters<
					typeof findValidEmailVerificationToken
				>[0],
				"non-existent-hash",
			);

			expect(result).toBeUndefined();
		});

		test("should return undefined if token is expired", async () => {
			// Mock returns an expired token so the application-layer expiry check
			// in findValidEmailVerificationToken will detect it and return undefined
			const mockToken = {
				id: "token-id",
				userId: "user-id",
				expiresAt: new Date(Date.now() - 86400000), // 1 day in past
				usedAt: null,
			};
			const mockLimit = vi.fn().mockReturnValue(Promise.resolve([mockToken]));
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.select.mockReturnValue({ from: mockFrom });

			const result = await findValidEmailVerificationToken(
				mockDrizzleClient as unknown as Parameters<
					typeof findValidEmailVerificationToken
				>[0],
				"expired-token-hash",
			);

			expect(result).toBeUndefined();
		});

		test("should return undefined if token has been used (usedAt is set)", async () => {
			// Mock simulates the real WHERE clause filtering out used tokens
			// (WHERE usedAt IS NULL would exclude this token in the real query)
			const mockLimit = vi.fn().mockReturnValue(Promise.resolve([])); // Empty array = filtered out
			const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.select.mockReturnValue({ from: mockFrom });

			const result = await findValidEmailVerificationToken(
				mockDrizzleClient as unknown as Parameters<
					typeof findValidEmailVerificationToken
				>[0],
				"used-token-hash",
			);

			// Token filtered by WHERE clause, so undefined returned
			expect(result).toBeUndefined();
		});
	});

	suite("markEmailVerificationTokenAsUsed", () => {
		test("should return true when token is marked as used successfully", async () => {
			const mockResult = [{ id: "token-id" }];
			const mockReturning = vi.fn().mockResolvedValue(mockResult);
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.update.mockReturnValue({ set: mockSet });

			const result = await markEmailVerificationTokenAsUsed(
				mockDrizzleClient as unknown as Parameters<
					typeof markEmailVerificationTokenAsUsed
				>[0],
				"token-hash",
			);

			expect(result).toBe(true);
		});

		test("should return false when token is not found or already used", async () => {
			const mockReturning = vi.fn().mockResolvedValue([]);
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.update.mockReturnValue({ set: mockSet });

			const result = await markEmailVerificationTokenAsUsed(
				mockDrizzleClient as unknown as Parameters<
					typeof markEmailVerificationTokenAsUsed
				>[0],
				"non-existent-hash",
			);

			expect(result).toBe(false);
		});
	});

	suite("revokeAllUserEmailVerificationTokens", () => {
		test("should return the number of tokens revoked", async () => {
			const mockResult = [{ id: "token-1" }, { id: "token-2" }];
			const mockReturning = vi.fn().mockResolvedValue(mockResult);
			const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
			const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
			mockDrizzleClient.update.mockReturnValue({ set: mockSet });

			const result = await revokeAllUserEmailVerificationTokens(
				mockDrizzleClient as unknown as Parameters<
					typeof revokeAllUserEmailVerificationTokens
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

			const result = await revokeAllUserEmailVerificationTokens(
				mockDrizzleClient as unknown as Parameters<
					typeof revokeAllUserEmailVerificationTokens
				>[0],
				"user-with-no-tokens",
			);

			expect(result).toBe(0);
		});
	});
});
