/**
 * Redis-backed rate limiter for password change requests.
 *
 * Uses the CacheService (Redis) to store rate limit state, which works
 * across multiple server instances in production deployments.
 *
 * Implements a fixed time window: the window starts on the first request
 * and expires after the configured duration, regardless of subsequent requests.
 */

import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/** Minimal cache interface needed for rate limiting (compatible with ctx.cache). */
export type RateLimitCache = {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T, ttlSeconds: number): Promise<unknown>;
};

/** Minimal logger interface for rate limit violation logging. */
export type RateLimitLogger = {
	warn: (obj: object, msg?: string) => void;
};

const DEFAULT_WINDOW_SECONDS = 60 * 60; // 1 hour
const DEFAULT_MAX_CHANGES = 3;
const CACHE_KEY_PREFIX = "rate_limit:password_change:";

interface RateLimitEntry {
	count: number;
	/** Unix timestamp (ms) when this fixed window expires. */
	expiresAt: number;
}

export interface PasswordChangeRateLimitConfig {
	maxChanges?: number;
	windowSeconds?: number;
}

/**
 * Checks if a user has exceeded the rate limit for password changes.
 * Uses Redis via CacheService with a fixed time window.
 *
 * @param cache - The cache instance (Redis-backed)
 * @param userId - The user ID to check
 * @param logger - Logger for violation logging
 * @param config - Optional configurable limits
 * @throws TalawaGraphQLError with code "too_many_requests" and httpStatus 429
 */
export async function checkPasswordChangeRateLimit(
	cache: RateLimitCache,
	userId: string,
	logger: RateLimitLogger,
	config?: PasswordChangeRateLimitConfig,
): Promise<void> {
	const maxChanges = config?.maxChanges ?? DEFAULT_MAX_CHANGES;
	const windowSeconds = config?.windowSeconds ?? DEFAULT_WINDOW_SECONDS;
	const key = `${CACHE_KEY_PREFIX}${userId}`;
	const entry = await cache.get<RateLimitEntry>(key);

	if (!entry) {
		// First request in window — start tracking with fixed expiry
		const expiresAt = Date.now() + windowSeconds * 1000;
		await cache.set<RateLimitEntry>(
			key,
			{ count: 1, expiresAt },
			windowSeconds,
		);
		return;
	}

	const now = Date.now();
	const remainingMs = entry.expiresAt - now;

	// If the fixed window has expired (cache TTL race), treat it as new window
	if (remainingMs <= 0) {
		const expiresAt = Date.now() + windowSeconds * 1000;
		await cache.set<RateLimitEntry>(
			key,
			{ count: 1, expiresAt },
			windowSeconds,
		);
		return;
	}

	if (entry.count >= maxChanges) {
		const retryAfterSeconds = Math.ceil(remainingMs / 1000);

		// Log the rate limit violation for security monitoring
		logger.warn(
			{
				userId,
				attemptCount: entry.count,
				retryAfterSeconds,
			},
			"Password change rate limit exceeded",
		);

		throw new TalawaGraphQLError({
			message: `Too many password change attempts. Please try again in ${retryAfterSeconds} second(s).`,
			extensions: {
				code: "too_many_requests",
				httpStatus: 429,
			},
		});
	}

	// Increment count, preserve the original fixed window TTL
	const remainingTtlSeconds = Math.ceil(remainingMs / 1000);
	await cache.set<RateLimitEntry>(
		key,
		{ count: entry.count + 1, expiresAt: entry.expiresAt },
		remainingTtlSeconds,
	);
}
