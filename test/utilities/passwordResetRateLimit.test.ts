import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkPasswordResetRateLimit,
	PASSWORD_RESET_RATE_LIMITS,
	resetPasswordResetRateLimit,
	__resetLastCleanupAtForTests,
} from "~/src/utilities/passwordResetRateLimit";

describe("passwordResetRateLimit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Clear rate limit state between tests for isolation
		PASSWORD_RESET_RATE_LIMITS.clear();
		__resetLastCleanupAtForTests(0);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("checkPasswordResetRateLimit", () => {
		it("should allow first request", () => {
			const email = "user1@example.com";
			const result = checkPasswordResetRateLimit(email);
			expect(result).toBe(true);
		});

		it("should allow up to 5 requests within the window", () => {
			const email = "user2@example.com";

			// First 5 requests should be allowed
			expect(checkPasswordResetRateLimit(email)).toBe(true);
			expect(checkPasswordResetRateLimit(email)).toBe(true);
			expect(checkPasswordResetRateLimit(email)).toBe(true);
			expect(checkPasswordResetRateLimit(email)).toBe(true);
			expect(checkPasswordResetRateLimit(email)).toBe(true);
		});

		it("should block 6th request within the same window", () => {
			const email = "user3@example.com";

			// First 5 allowed
			for (let i = 0; i < 5; i++) {
				checkPasswordResetRateLimit(email);
			}

			// 6th should be blocked
			expect(checkPasswordResetRateLimit(email)).toBe(false);
		});

		it("should handle multiple users independently", () => {
			const email1 = "user4@example.com";
			const email2 = "user5@example.com";

			// User 1 makes 5 requests
			for (let i = 0; i < 5; i++) {
				checkPasswordResetRateLimit(email1);
			}

			// User 2 should still be allowed
			expect(checkPasswordResetRateLimit(email2)).toBe(true);

			// User 1 should be blocked on 6th
			expect(checkPasswordResetRateLimit(email1)).toBe(false);
		});

		it("should reset window after expiry", () => {
			const email = "user6@example.com";
			const startTime = 1000000000;

			// Use fake timers for deterministic time control
			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// Make 5 requests
			for (let i = 0; i < 5; i++) {
				checkPasswordResetRateLimit(email);
			}

			// 6th should be blocked
			expect(checkPasswordResetRateLimit(email)).toBe(false);

			// Advance time by 1 hour + 1ms (window expired)
			vi.advanceTimersByTime(60 * 60 * 1000 + 1);

			// Should be allowed again (new window)
			expect(checkPasswordResetRateLimit(email)).toBe(true);

			// Restore real timers
			vi.useRealTimers();
		});

		it("should test exact window boundary at expiry time", () => {
			const email = "user-boundary@example.com";
			const startTime = 2000000000;

			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// Make 5 requests
			for (let i = 0; i < 5; i++) {
				checkPasswordResetRateLimit(email);
			}

			// 6th blocked
			expect(checkPasswordResetRateLimit(email)).toBe(false);

			// Exactly at expiry (window just ends - still allowed as new window)
			vi.setSystemTime(startTime + 60 * 60 * 1000);
			expect(checkPasswordResetRateLimit(email)).toBe(true);

			// 1ms after expiry (new window starts)
			vi.setSystemTime(startTime + 60 * 60 * 1000 + 1);
			expect(checkPasswordResetRateLimit(email)).toBe(true);

			vi.useRealTimers();
		});
	});

	describe("cleanup mechanism", () => {
		it("should cleanup old entries", () => {
			const email = "cleanup_test@example.com";
			const startTime = 1000000;

			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// create an entry
			checkPasswordResetRateLimit(email);
			expect(PASSWORD_RESET_RATE_LIMITS.has(email)).toBe(true);

			// Advance time beyond cleanup threshold (2 hours)
			// Window is 1 hour, cleanup checks for > 2 hours
			vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1000);

			// Trigger cleanup (it runs every 5 minutes on check)
			// Use a different email to trigger the check without modifying the original entry map state for that email immediately (though check cleans up first)
			checkPasswordResetRateLimit("trigger@example.com");

			// Old entry should be gone
			expect(PASSWORD_RESET_RATE_LIMITS.has(email)).toBe(false);

			vi.useRealTimers();
		});
	});

	describe("resetPasswordResetRateLimit", () => {
		it("should reset rate limit for a specific user", () => {
			const email = "user7@example.com";

			// Exhaust rate limit
			for (let i = 0; i < 5; i++) {
				checkPasswordResetRateLimit(email);
			}

			// Should be blocked
			expect(checkPasswordResetRateLimit(email)).toBe(false);

			// Reset
			resetPasswordResetRateLimit(email);

			// Should be allowed again
			expect(checkPasswordResetRateLimit(email)).toBe(true);
		});

		it("should not affect other users when resetting", () => {
			const email1 = "user8@example.com";
			const email2 = "user9@example.com";

			// Both make requests
			for (let i = 0; i < 5; i++) {
				checkPasswordResetRateLimit(email1);
				checkPasswordResetRateLimit(email2);
			}

			// Reset email1
			resetPasswordResetRateLimit(email1);

			// Email1 should be allowed again
			expect(checkPasswordResetRateLimit(email1)).toBe(true);

			// Email2 should still be blocked
			expect(checkPasswordResetRateLimit(email2)).toBe(false);
		});
	});
});
