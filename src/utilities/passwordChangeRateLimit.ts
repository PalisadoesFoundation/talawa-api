/**
 * Redis-backed rate limiter for password change requests.
 *
 * Uses the CacheService (Redis) to store rate limit state, which works
 * across multiple server instances in production deployments.
 */

import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/** Minimal cache interface needed for rate limiting (compatible with ctx.cache). */
export type RateLimitCache = {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T, ttlSeconds: number): Promise<unknown>;
};

const RATE_LIMIT_WINDOW_SECONDS = 60 * 60; // 1 hour
const MAX_CHANGES_PER_WINDOW = 3;
const CACHE_KEY_PREFIX = "rate_limit:password_change:";

interface RateLimitEntry {
	count: number;
}

/**
 * Checks if a user has exceeded the rate limit for password changes.
 * Uses Redis via CacheService with automatic TTL-based expiration.
 *
 * @param cache - The CacheService instance (Redis-backed)
 * @param userId - The user ID to check
 * @throws TalawaGraphQLError with code "too_many_requests" if rate limit exceeded
 */
export async function checkPasswordChangeRateLimit(
	cache: RateLimitCache,
	userId: string,
): Promise<void> {
	const key = `${CACHE_KEY_PREFIX}${userId}`;
	const entry = await cache.get<RateLimitEntry>(key);

	if (!entry) {
		// First request in window — start tracking
		await cache.set<RateLimitEntry>(
			key,
			{ count: 1 },
			RATE_LIMIT_WINDOW_SECONDS,
		);
		return;
	}

	if (entry.count >= MAX_CHANGES_PER_WINDOW) {
		throw new TalawaGraphQLError({
			message: "Too many password change attempts. Please try again later.",
			extensions: {
				code: "too_many_requests",
			},
		});
	}

	// Increment count, preserve remaining TTL by re-setting with same window
	await cache.set<RateLimitEntry>(
		key,
		{ count: entry.count + 1 },
		RATE_LIMIT_WINDOW_SECONDS,
	);
}
