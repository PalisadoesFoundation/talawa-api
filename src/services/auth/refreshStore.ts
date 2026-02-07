import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { refreshTokensTable } from "~/src/drizzle/tables/refreshTokens";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";

/**
 * SHA-256 hash of a string (hex-encoded).
 * Used internally for token hashing; exported for tests.
 */
export function sha256(s: string): string {
	return crypto.createHash("sha256").update(s).digest("hex");
}

/**
 * Parameters for persisting a refresh token.
 * ip and userAgent are accepted for future compatibility but not persisted (table has no such columns).
 */
export interface PersistRefreshTokenParams {
	token: string;
	userId: string;
	/** Optional, not persisted in current schema */
	ip?: string;
	/** Optional, not persisted in current schema */
	userAgent?: string;
	ttlSec: number;
}

/**
 * Persists a refresh token in the database.
 * Stores only userId, tokenHash (SHA-256 of token), and expiresAt.
 */
export async function persistRefreshToken(
	db: DrizzleClient,
	params: PersistRefreshTokenParams,
): Promise<void> {
	const expiresAt = new Date(Date.now() + params.ttlSec * 1000);
	await db.insert(refreshTokensTable).values({
		userId: params.userId,
		tokenHash: sha256(params.token),
		expiresAt,
	});
}

/**
 * Revokes a refresh token by setting revokedAt.
 */
export async function revokeRefreshToken(
	db: DrizzleClient,
	token: string,
): Promise<void> {
	await db
		.update(refreshTokensTable)
		.set({ revokedAt: new Date() })
		.where(eq(refreshTokensTable.tokenHash, sha256(token)));
}

/**
 * Returns true only if a row exists for the given userId and token hash,
 * and it is not revoked and not expired.
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
