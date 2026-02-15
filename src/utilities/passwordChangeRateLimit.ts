/**
 * Simple in-memory rate limiter for password change requests.
 *
 * Note: This is an in-memory solution that won't work across multiple server instances.
 * For production multi-instance deployments, consider using Redis-based rate limiting.
 */

interface RateLimitEntry {
	count: number;
	windowStart: number;
}

export const PASSWORD_CHANGE_RATE_LIMITS = new Map<string, RateLimitEntry>();

export const RATE_LIMIT_WINDOW_MS = Number.parseInt(
	process.env.PASSWORD_RATE_WINDOW_MS || "3600000",
	10,
); // default 1 hour
export const MAX_REQUESTS_PER_WINDOW = Number.parseInt(
	process.env.PASSWORD_MAX_REQUESTS || "3",
	10,
); // default 3
export const CLEANUP_INTERVAL_MS = Number.parseInt(
	process.env.PASSWORD_RATE_CLEANUP_INTERVAL_MS || "300000",
	10,
); // default 5 minutes

let lastCleanupAt = 0;

/**
 * Checks if a user is currently under the rate limit for password change requests.
 * This is a pure check that does not mutate state.
 *
 * @param userId - The user ID to check
 * @returns true if request is allowed, false if rate limit exceeded
 */
export function checkPasswordChangeRateLimit(userId: string): boolean {
	const now = Date.now();
	const entry = PASSWORD_CHANGE_RATE_LIMITS.get(userId);

	if (!entry) {
		return true;
	}

	// Window has expired — user is allowed
	if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
		return true;
	}

	// Within window — check count
	return entry.count < MAX_REQUESTS_PER_WINDOW;
}

/**
 * Consumes one rate limit slot for the given user.
 * Creates or resets the entry as needed and increments the count.
 * Should be called only after a successful password update.
 *
 * @param userId - The user ID to record a consumption for
 */
export function consumePasswordChangeRateLimit(userId: string): void {
	const now = Date.now();
	const entry = PASSWORD_CHANGE_RATE_LIMITS.get(userId);

	// Perform time-based cleanup every CLEANUP_INTERVAL_MS
	if (now - lastCleanupAt >= CLEANUP_INTERVAL_MS) {
		cleanupOldEntries(now);
		lastCleanupAt = now;
	}

	if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
		// First request or window expired — start a new window
		PASSWORD_CHANGE_RATE_LIMITS.set(userId, {
			count: 1,
			windowStart: now,
		});
		return;
	}

	// Within window — increment count
	entry.count++;
}

/**
 * Cleans up rate limit entries older than the rate limit window.
 * @param now - Current timestamp
 */
function cleanupOldEntries(now: number): void {
	for (const [userId, entry] of PASSWORD_CHANGE_RATE_LIMITS.entries()) {
		if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS * 2) {
			PASSWORD_CHANGE_RATE_LIMITS.delete(userId);
		}
	}
}

/**
 * Resets the rate limit for a specific user (useful for testing).
 * @param userId - The user ID to reset
 * @returns void
 */
export function resetPasswordChangeRateLimit(userId: string): void {
	PASSWORD_CHANGE_RATE_LIMITS.delete(userId);
}

/**
 * Resets the last cleanup timestamp (useful for testing).
 * @param value - The value to set lastCleanupAt to (default 0)
 * @returns void
 * @internal This function is for testing purposes only.
 */
export function __resetLastCleanupAtForTests(value = 0): void {
	lastCleanupAt = value;
}
