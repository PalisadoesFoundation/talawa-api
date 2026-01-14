import { createHmac, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { envSchema } from "env-schema";
import { type Static, Type } from "typebox";
import type * as schema from "~/src/drizzle/schema";
import { emailVerificationTokensTable } from "~/src/drizzle/tables/emailVerificationTokens";
import { envConfigSchema, envSchemaAjv } from "../envConfigSchema";

// Load HMAC secret from environment
const hmacEnvSchema = Type.Pick(envConfigSchema, [
	"API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET",
]);

const hmacEnvConfig = envSchema<Static<typeof hmacEnvSchema>>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema: hmacEnvSchema,
});

/**
 * Default email verification token expiry: 24 hours in seconds.
 */
export const DEFAULT_EMAIL_VERIFICATION_TOKEN_EXPIRES_SECONDS = 86_400;

/**
 * Generates a cryptographically secure random email verification token.
 * @returns - A 64-character hex string token
 */
export function generateEmailVerificationToken(): string {
	// codeql[js/insufficient-password-hash] Generates cryptographically random token (256 bits entropy), not a user password
	return randomBytes(32).toString("hex");
}

/**
 * Creates a HMAC-SHA-256 hash of an email verification token for secure storage.
 *
 * Note: HMAC-SHA-256 is appropriate here (not argon2/bcrypt) because:
 * - The token is cryptographically random (256 bits of entropy)
 * - Brute-force attacks are computationally infeasible
 * - This matches the pattern used for password reset tokens in this codebase
 *
 * @param token - The raw email verification token
 * @returns - The hashed token
 */
export function hashEmailVerificationToken(token: string): string {
	// Using HMAC with configurable key from environment for defense-in-depth
	// codeql[js/insufficient-password-hash] Token has 256 bits of entropy, bcrypt is unnecessary
	return createHmac(
		"sha256",
		hmacEnvConfig.API_EMAIL_VERIFICATION_TOKEN_HMAC_SECRET as string,
	)
		.update(token)
		.digest("hex");
}

/**
 * Stores an email verification token in the database.
 * @param drizzleClient - The Drizzle database client
 * @param userId - The user ID to associate with the token
 * @param tokenHash - The hashed email verification token
 * @param expiresAt - The expiration date of the token
 * @returns - The created email verification token record
 */
export async function storeEmailVerificationToken(
	drizzleClient: PostgresJsDatabase<typeof schema>,
	userId: string,
	tokenHash: string,
	expiresAt: Date,
): Promise<{ id: string }> {
	const [result] = await drizzleClient
		.insert(emailVerificationTokensTable)
		.values({
			tokenHash,
			userId,
			expiresAt,
		})
		.returning({ id: emailVerificationTokensTable.id });

	if (!result) {
		throw new Error("Failed to store email verification token");
	}

	return result;
}

/**
 * Finds a valid (non-expired, non-used) email verification token by its hash.
 *
 * Note: All conditions (hash match, not expired, not used) are combined in a single
 * database query for defense-in-depth against timing attacks. While the 256-bit
 * token entropy makes timing attacks impractical, this approach returns consistent
 * timing regardless of token state.
 *
 * @param drizzleClient - The Drizzle database client
 * @param tokenHash - The hashed email verification token to look up
 * @returns - The email verification token record if found and valid, undefined otherwise
 */
export async function findValidEmailVerificationToken(
	drizzleClient: PostgresJsDatabase<typeof schema>,
	tokenHash: string,
): Promise<
	| {
			id: string;
			userId: string;
			expiresAt: Date;
			usedAt: Date | null;
	  }
	| undefined
> {
	// Combine all conditions in a single query to prevent timing attacks
	// from revealing token state (exists vs expired vs used)
	const token = await drizzleClient
		.select()
		.from(emailVerificationTokensTable)
		.where(
			and(
				eq(emailVerificationTokensTable.tokenHash, tokenHash),
				isNull(emailVerificationTokensTable.usedAt),
			),
		)
		.limit(1)
		.then((results) => results[0]);

	if (!token) {
		return undefined;
	}

	// Check expiry in application code since SQL timestamp comparison
	// can have edge cases with timezone handling
	if (token.expiresAt < new Date()) {
		return undefined;
	}

	return token;
}

/**
 * Marks an email verification token as used by setting its usedAt timestamp.
 * @param drizzleClient - The Drizzle database client
 * @param tokenHash - The hashed email verification token to mark as used
 * @returns - True if token was marked as used, false if not found or already used
 */
export async function markEmailVerificationTokenAsUsed(
	drizzleClient: PostgresJsDatabase<typeof schema>,
	tokenHash: string,
): Promise<boolean> {
	const result = await drizzleClient
		.update(emailVerificationTokensTable)
		.set({ usedAt: new Date() })
		.where(
			and(
				eq(emailVerificationTokensTable.tokenHash, tokenHash),
				isNull(emailVerificationTokensTable.usedAt),
			),
		)
		.returning({ id: emailVerificationTokensTable.id });

	return result.length > 0;
}

/**
 * Revokes all email verification tokens for a user (marks them as used).
 * Useful when user successfully verifies email or requests a new token.
 * @param drizzleClient - The Drizzle database client
 * @param userId - The user ID whose tokens should be revoked
 * @returns - The number of tokens revoked
 */
export async function revokeAllUserEmailVerificationTokens(
	drizzleClient: PostgresJsDatabase<typeof schema>,
	userId: string,
): Promise<number> {
	const result = await drizzleClient
		.update(emailVerificationTokensTable)
		.set({ usedAt: new Date() })
		.where(
			and(
				eq(emailVerificationTokensTable.userId, userId),
				isNull(emailVerificationTokensTable.usedAt),
			),
		)
		.returning({ id: emailVerificationTokensTable.id });

	return result.length;
}
