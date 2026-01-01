import { createHmac, randomBytes } from "node:crypto";
import { type Static, Type } from "typebox";
import { and, eq, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { envSchema } from "env-schema";
import type * as schema from "~/src/drizzle/schema";
import { passwordResetTokensTable } from "~/src/drizzle/tables/passwordResetTokens";
import { envConfigSchema, envSchemaAjv } from "../envConfigSchema";

// Load HMAC secret from environment
const hmacEnvSchema = Type.Pick(envConfigSchema, [
	"API_PASSWORD_RESET_TOKEN_HMAC_SECRET",
]);

const hmacEnvConfig = envSchema<Static<typeof hmacEnvSchema>>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema: hmacEnvSchema,
});

/**
 * Default password reset token expiry for User Portal: 14 days in seconds.
 * Similar to Gmail's password reset expiry.
 */
export const DEFAULT_USER_PASSWORD_RESET_TOKEN_EXPIRES_SECONDS = 1_209_600;

/**
 * Default password reset token expiry for Admin Portal: 1 hour in seconds.
 * Similar to Google Admin Console's password reset expiry.
 */
export const DEFAULT_ADMIN_PASSWORD_RESET_TOKEN_EXPIRES_SECONDS = 3_600;

/**
 * Generates a cryptographically secure random password reset token.
 * @returns - A 64-character hex string token
 */
export function generatePasswordResetToken(): string {
	// codeql[js/insufficient-password-hash] Generates cryptographically random token (256 bits entropy), not a user password
	return randomBytes(32).toString("hex");
}

/**
 * Creates a HMAC-SHA-256 hash of a password reset token for secure storage.
 *
 * Note: HMAC-SHA-256 is appropriate here (not argon2/bcrypt) because:
 * - The token is cryptographically random (256 bits of entropy)
 * - Brute-force attacks are computationally infeasible
 * - This matches the pattern used for refresh tokens in this codebase
 *
 * @param token - The raw password reset token
 * @returns - The hashed token
 */
export function hashPasswordResetToken(token: string): string {
	// Using HMAC with configurable key from environment for defense-in-depth
	// codeql[js/insufficient-password-hash] Token has 256 bits of entropy, bcrypt is unnecessary
	return createHmac(
		"sha256",
		hmacEnvConfig.API_PASSWORD_RESET_TOKEN_HMAC_SECRET as string,
	)
		.update(token)
		.digest("hex");
}

/**
 * Stores a password reset token in the database.
 * @param drizzleClient - The Drizzle database client
 * @param userId - The user ID to associate with the token
 * @param tokenHash - The hashed password reset token
 * @param expiresAt - The expiration date of the token, or null for tokens that never expire
 * @returns - The created password reset token record
 */
export async function storePasswordResetToken(
	drizzleClient: PostgresJsDatabase<typeof schema>,
	userId: string,
	tokenHash: string,
	expiresAt: Date | null,
): Promise<{ id: string }> {
	const [result] = await drizzleClient
		.insert(passwordResetTokensTable)
		.values({
			tokenHash,
			userId,
			expiresAt,
		})
		.returning({ id: passwordResetTokensTable.id });

	if (!result) {
		throw new Error("Failed to store password reset token");
	}

	return result;
}

/**
 * Finds a valid (non-expired, non-used) password reset token by its hash.
 *
 * Note: All conditions (hash match, not expired, not used) are combined in a single
 * database query for defense-in-depth against timing attacks. While the 256-bit
 * token entropy makes timing attacks impractical, this approach returns consistent
 * timing regardless of token state.
 *
 * @param drizzleClient - The Drizzle database client
 * @param tokenHash - The hashed password reset token to look up
 * @returns - The password reset token record if found and valid, undefined otherwise
 */
export async function findValidPasswordResetToken(
	drizzleClient: PostgresJsDatabase<typeof schema>,
	tokenHash: string,
): Promise<
	| {
			id: string;
			userId: string;
			expiresAt: Date | null;
			usedAt: Date | null;
	  }
	| undefined
> {
	// Combine all conditions in a single query to prevent timing attacks
	// from revealing token state (exists vs expired vs used)
	const token = await drizzleClient
		.select()
		.from(passwordResetTokensTable)
		.where(
			and(
				eq(passwordResetTokensTable.tokenHash, tokenHash),
				isNull(passwordResetTokensTable.usedAt),
			),
		)
		.limit(1)
		.then((results) => results[0]);

	if (!token) {
		return undefined;
	}

	// Check expiry in application code since SQL timestamp comparison
	// can have edge cases with timezone handling
	// null expiresAt means token never expires (0 = no timeout)
	if (token.expiresAt !== null && token.expiresAt < new Date()) {
		return undefined;
	}

	return token;
}

/**
 * Marks a password reset token as used by setting its usedAt timestamp.
 * @param drizzleClient - The Drizzle database client
 * @param tokenHash - The hashed password reset token to mark as used
 * @returns - True if token was marked as used, false if not found or already used
 */
export async function markPasswordResetTokenAsUsed(
	drizzleClient: PostgresJsDatabase<typeof schema>,
	tokenHash: string,
): Promise<boolean> {
	const result = await drizzleClient
		.update(passwordResetTokensTable)
		.set({ usedAt: new Date() })
		.where(
			and(
				eq(passwordResetTokensTable.tokenHash, tokenHash),
				isNull(passwordResetTokensTable.usedAt),
			),
		)
		.returning({ id: passwordResetTokensTable.id });

	return result.length > 0;
}

/**
 * Revokes all password reset tokens for a user (marks them as used).
 * Useful when user successfully resets password or requests a new token.
 * @param drizzleClient - The Drizzle database client
 * @param userId - The user ID whose tokens should be revoked
 * @returns - The number of tokens revoked
 */
export async function revokeAllUserPasswordResetTokens(
	drizzleClient: PostgresJsDatabase<typeof schema>,
	userId: string,
): Promise<number> {
	const result = await drizzleClient
		.update(passwordResetTokensTable)
		.set({ usedAt: new Date() })
		.where(
			and(
				eq(passwordResetTokensTable.userId, userId),
				isNull(passwordResetTokensTable.usedAt),
			),
		)
		.returning({ id: passwordResetTokensTable.id });

	return result.length;
}
