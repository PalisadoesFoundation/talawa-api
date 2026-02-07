import { hash, verify } from "@node-rs/argon2";

/** Argon2id = 2 (avoid const enum for isolatedModules). */
const ARGON2ID = 2;

/**
 * Argon2id options matching existing signIn verification (m=19456, t=2, p=1).
 * Hashes produced here are compatible with GraphQL signIn and future REST signIn.
 */
const ARGON2_OPTIONS = {
	algorithm: ARGON2ID,
	memoryCost: 19456,
	outputLen: 32,
	parallelism: 1,
	timeCost: 2,
} as const;

/**
 * Hashes a plain-text password using Argon2id.
 * @param plain - Plain-text password to hash.
 * @returns The argon2id hash string.
 */
export async function hashPassword(plain: string): Promise<string> {
	return hash(plain, ARGON2_OPTIONS);
}

/**
 * Verifies a plain-text password against an argon2id hash.
 * @param hashStr - Stored hash string (e.g. from database).
 * @param plain - Plain-text password to check.
 * @returns True if the password matches; false on wrong password or invalid hash (never throws).
 */
export async function verifyPassword(
	hashStr: string,
	plain: string,
): Promise<boolean> {
	try {
		return await verify(hashStr, plain);
	} catch (error) {
		// verifyPassword API contract: return false on any verify(hashStr, plain) error (invalid hash or wrong password); do not throw.
		// validate_error_handling requires catch to log or rethrow: approved suppression — debug log only, then return false.
		// biome-ignore lint/suspicious/noConsole: required by validate_error_handling for proper catch logging
		console.debug(
			"Password verification failed",
			error instanceof Error ? error.message : String(error),
		);
		return false;
	}
}
