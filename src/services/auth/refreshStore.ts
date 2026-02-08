import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { refreshTokensTable } from "~/src/drizzle/tables/refreshTokens";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

/**
 * SHA-256 hash of a string (hex-encoded).
 * Used internally for token hashing; exported for tests.
 *
 * @param s - Input string to hash.
 * @returns 64-character hex-encoded SHA-256 hash.
 */
export function sha256(s: string): string {
	return crypto.createHash("sha256").update(s).digest("hex");
}

/**
 * Parameters for persisting a refresh token.
 * - token: raw refresh token (hashed before storage).
 * - userId: user ID to associate with the token.
 * - ttlSec: time-to-live in seconds; must be greater than 0.
 * - ip, userAgent: accepted but not persisted (no table columns); deprecated for future use.
 */
export interface PersistRefreshTokenParams {
	token: string;
	userId: string;
	/** @deprecated Not stored; table has no ip column. Kept for API compatibility. */
	ip?: string;
	/** @deprecated Not stored; table has no userAgent column. Kept for API compatibility. */
	userAgent?: string;
	ttlSec: number;
}

/**
 * Persists a refresh token in the database.
 * Stores only userId, tokenHash (SHA-256 of token), and expiresAt.
 * Throws if params.ttlSec is not positive (avoids immediately-expired tokens).
 *
 * @param db - Drizzle client.
 * @param params - Token, userId, ttlSec; ip/userAgent accepted but not persisted.
 * @returns Promise that resolves when the insert completes.
 * @throws TalawaRestError with code INVALID_ARGUMENTS if params.ttlSec is not positive.
 */
export async function persistRefreshToken(
	db: DrizzleClient,
	params: PersistRefreshTokenParams,
): Promise<void> {
	if (params.ttlSec <= 0) {
		throw new TalawaRestError({
			code: ErrorCode.INVALID_ARGUMENTS,
			message: `persistRefreshToken: params.ttlSec must be positive (got ${params.ttlSec}). Check token TTL configuration.`,
			details: { ttlSec: params.ttlSec },
		});
	}
	const expiresAt = new Date(Date.now() + params.ttlSec * 1000);
	await db.insert(refreshTokensTable).values({
		userId: params.userId,
		tokenHash: sha256(params.token),
		expiresAt,
	});
}

/**
 * Revokes a refresh token by setting revokedAt.
 * Callers can use the return value to detect whether a row was affected (e.g. token existed).
 *
 * @param db - Drizzle client.
 * @param token - Raw refresh token (will be hashed for lookup).
 * @returns Promise resolving to true if a row was updated, false if no row matched.
 */
export async function revokeRefreshToken(
	db: DrizzleClient,
	token: string,
): Promise<boolean> {
	const result = await db
		.update(refreshTokensTable)
		.set({ revokedAt: new Date() })
		.where(eq(refreshTokensTable.tokenHash, sha256(token)))
		.returning({ id: refreshTokensTable.id });
	return result.length > 0;
}

/**
 * Returns true only if a row exists for the given userId and token hash,
 * and it is not revoked and not expired.
 *
 * @param db - Drizzle client.
 * @param token - Raw refresh token (will be hashed for lookup).
 * @param userId - User ID to match.
 * @returns Promise resolving to true when the token is valid and not expired.
 */
export async function isRefreshTokenValid(
	db: DrizzleClient,
	token: string,
	userId: string,
): Promise<boolean> {
	const row = await db.query.refreshTokensTable.findFirst({
		where: (f, op) =>
			op.and(op.eq(f.userId, userId), op.eq(f.tokenHash, sha256(token))),
	});
	return (
		!!row && row.revokedAt === null && row.expiresAt.getTime() > Date.now()
	);
}
