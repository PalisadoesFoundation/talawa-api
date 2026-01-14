/**
 * Simple in-memory rate limiter for email verification requests.
 *
 * Note: This is an in-memory solution that won't work across multiple server instances.
 * For production multi-instance deployments, consider using Redis-based rate limiting.
 */

interface RateLimitEntry {
	count: number;
	windowStart: number;
}

const EMAIL_VERIFICATION_RATE_LIMITS = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 3;

/**
 * Checks if a user has exceeded the rate limit for email verification requests.
 * Uses a sliding window approach with automatic cleanup of old entries.
 *
 * @param userId - The user ID to check
 * @returns true if request is allowed, false if rate limit exceeded
 */
export function checkEmailVerificationRateLimit(userId: string): boolean {
	const now = Date.now();
	const entry = EMAIL_VERIFICATION_RATE_LIMITS.get(userId);

	// Clean up old entries periodically (every 100 checks)
	if (Math.random() < 0.01) {
		cleanupOldEntries(now);
	}

	if (!entry) {
		// First request
		EMAIL_VERIFICATION_RATE_LIMITS.set(userId, {
			count: 1,
			windowStart: now,
		});
		return true;
	}

	// Check if window has expired
	if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
		// Reset window
		EMAIL_VERIFICATION_RATE_LIMITS.set(userId, {
			count: 1,
			windowStart: now,
		});
		return true;
	}

	// Within window - check count
	if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
		return false; // Rate limit exceeded
	}

	// Increment count
	entry.count++;
	return true;
}

/**
 * Cleans up rate limit entries older than the rate limit window.
 * @param now - Current timestamp
 */
function cleanupOldEntries(now: number): void {
	for (const [userId, entry] of EMAIL_VERIFICATION_RATE_LIMITS.entries()) {
		if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS * 2) {
			EMAIL_VERIFICATION_RATE_LIMITS.delete(userId);
		}
	}
}

/**
 * Resets the rate limit for a specific user (useful for testing).
 * @param userId - The user ID to reset
 */
export function resetEmailVerificationRateLimit(userId: string): void {
	EMAIL_VERIFICATION_RATE_LIMITS.delete(userId);
}
