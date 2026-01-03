import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "~/src/drizzle/schema";
import { refreshTokensTable } from "~/src/drizzle/tables/refreshTokens";

/**
 * Default refresh token expiry: 7 days in milliseconds.
 * Used as fallback when API_REFRESH_TOKEN_EXPIRES_IN is not configured.
 */
export const DEFAULT_REFRESH_TOKEN_EXPIRES_MS = 604_800_000;

/**
 * Generates a cryptographically secure random refresh token.
 * @returns - A 64-character hex string token
 */
export function generateRefreshToken(): string {
	return randomBytes(32).toString("hex");
}

/**
 * Creates a SHA-256 hash of a refresh token for secure storage.
 * @param token - The raw refresh token
 * @returns - The hashed token
 */
export function hashRefreshToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

/**
 * Stores a refresh token in the database.
 * @param drizzleClient - The Drizzle database client
 * @param userId - The user ID to associate with the token
 * @param tokenHash - The hashed refresh token
 * @param expiresAt - The expiration date of the token
 * @returns - The created refresh token record
 */
export async function storeRefreshToken(
	drizzleClient: PostgresJsDatabase<typeof schema>,
	userId: string,
	tokenHash: string,
	expiresAt: Date,
): Promise<{ id: string }> {
	const [result] = await drizzleClient
		.insert(refreshTokensTable)
		.values({
			tokenHash,
			userId,
			expiresAt,
		})
		.returning({ id: refreshTokensTable.id });

	if (!result) {
		throw new Error("Failed to store refresh token");
	}

	return result;
}

/**
 * Finds a valid (non-expired, non-revoked) refresh token by its hash.
 * @param drizzleClient - The Drizzle database client
 * @param tokenHash - The hashed refresh token to look up
 * @returns - The refresh token record if found and valid, undefined otherwise
 */
export async function findValidRefreshToken(
	drizzleClient: PostgresJsDatabase<typeof schema>,
	tokenHash: string,
): Promise<
	| {
			id: string;
			userId: string;
			expiresAt: Date;
			revokedAt: Date | null;
	  }
	| undefined
> {
	const token = await drizzleClient.query.refreshTokensTable.findFirst({
		where: (fields, operators) => operators.eq(fields.tokenHash, tokenHash),
	});

	if (!token) {
		return undefined;
	}

	// Check if token is expired
	if (token.expiresAt < new Date()) {
		return undefined;
	}

	// Check if token is revoked
	if (token.revokedAt !== null) {
		return undefined;
	}

	return token;
}

/**
 * Revokes a refresh token by setting its revokedAt timestamp.
 * @param drizzleClient - The Drizzle database client
 * @param tokenHash - The hashed refresh token to revoke
 * @returns - True if token was revoked, false if not found or already revoked
 */
export async function revokeRefreshTokenByHash(
	drizzleClient: PostgresJsDatabase<typeof schema>,
	tokenHash: string,
): Promise<boolean> {
	const result = await drizzleClient
		.update(refreshTokensTable)
		.set({ revokedAt: new Date() })
		.where(
			and(
				eq(refreshTokensTable.tokenHash, tokenHash),
				isNull(refreshTokensTable.revokedAt),
			),
		)
		.returning({ id: refreshTokensTable.id });

	return result.length > 0;
}

/**
 * Revokes all refresh tokens for a user (useful for logout from all devices).
 * @param drizzleClient - The Drizzle database client
 * @param userId - The user ID whose tokens should be revoked
 * @returns - The number of tokens revoked
 */
export async function revokeAllUserRefreshTokens(
	drizzleClient: PostgresJsDatabase<typeof schema>,
	userId: string,
): Promise<number> {
	const result = await drizzleClient
		.update(refreshTokensTable)
		.set({ revokedAt: new Date() })
		.where(
			and(
				eq(refreshTokensTable.userId, userId),
				isNull(refreshTokensTable.revokedAt),
			),
		)
		.returning({ id: refreshTokensTable.id });

	return result.length;
}
