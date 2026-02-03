/**
 * Simple in-memory rate limiter for password reset requests.
 *
 * Note: This is an in-memory solution that won't work across multiple server instances.
 * For production multi-instance deployments, consider using Redis-based rate limiting.
 */

interface RateLimitEntry {
	count: number;
	windowStart: number;
}

export const PASSWORD_RESET_RATE_LIMITS = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let lastCleanupAt = 0;

/**
 * Checks if an email address has exceeded the rate limit for password reset requests.
 * Uses a fixed window approach (entire window resets when it expires).
 *
 * @param email - The email address to check
 * @returns true if request is allowed, false if rate limit exceeded
 */
export function checkPasswordResetRateLimit(email: string): boolean {
	const normalizedEmail = email.toLowerCase();
	const now = Date.now();
	const entry = PASSWORD_RESET_RATE_LIMITS.get(normalizedEmail);

	// Perform time-based cleanup every CLEANUP_INTERVAL_MS
	if (now - lastCleanupAt >= CLEANUP_INTERVAL_MS) {
		cleanupOldEntries(now);
		lastCleanupAt = now;
	}

	if (!entry) {
		// First request
		PASSWORD_RESET_RATE_LIMITS.set(normalizedEmail, {
			count: 1,
			windowStart: now,
		});
		return true;
	}

	// Check if window has expired
	if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
		// Reset window
		PASSWORD_RESET_RATE_LIMITS.set(normalizedEmail, {
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
	for (const [email, entry] of PASSWORD_RESET_RATE_LIMITS.entries()) {
		if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS * 2) {
			PASSWORD_RESET_RATE_LIMITS.delete(email);
		}
	}
}

/**
 * Resets the rate limit for a specific email (useful for testing).
 * @param email - The email address to reset
 */
export function resetPasswordResetRateLimit(email: string): void {
	PASSWORD_RESET_RATE_LIMITS.delete(email.toLowerCase());
}
