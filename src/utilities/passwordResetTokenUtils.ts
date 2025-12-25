import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "~/src/drizzle/schema";
import { passwordResetTokensTable } from "~/src/drizzle/tables/passwordResetTokens";

/**
 * Default password reset token expiry: 1 hour in milliseconds.
 * Used as fallback when API_PASSWORD_RESET_TOKEN_EXPIRES_IN is not configured.
 */
export const DEFAULT_PASSWORD_RESET_TOKEN_EXPIRES_MS = 3_600_000;

/**
 * Generates a cryptographically secure random password reset token.
 * @returns A 64-character hex string token
 */
export function generatePasswordResetToken(): string {
    return randomBytes(32).toString("hex");
}

/**
 * Creates a SHA-256 hash of a password reset token for secure storage.
 * @param token - The raw password reset token
 * @returns The hashed token
 */
export function hashPasswordResetToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

/**
 * Stores a password reset token in the database.
 * @param drizzleClient - The Drizzle database client
 * @param userId - The user ID to associate with the token
 * @param tokenHash - The hashed password reset token
 * @param expiresAt - The expiration date of the token
 * @returns The created password reset token record
 */
export async function storePasswordResetToken(
    drizzleClient: PostgresJsDatabase<typeof schema>,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
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
 * @param drizzleClient - The Drizzle database client
 * @param tokenHash - The hashed password reset token to look up
 * @returns The password reset token record if found and valid, undefined otherwise
 */
export async function findValidPasswordResetToken(
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
    const token =
        await drizzleClient.query.passwordResetTokensTable.findFirst({
            where: (fields, operators) => operators.eq(fields.tokenHash, tokenHash),
        });

    if (!token) {
        return undefined;
    }

    // Check if token is expired
    if (token.expiresAt < new Date()) {
        return undefined;
    }

    // Check if token is already used
    if (token.usedAt !== null) {
        return undefined;
    }

    return token;
}

/**
 * Marks a password reset token as used by setting its usedAt timestamp.
 * @param drizzleClient - The Drizzle database client
 * @param tokenHash - The hashed password reset token to mark as used
 * @returns True if token was marked as used, false if not found or already used
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
 * @returns The number of tokens revoked
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
