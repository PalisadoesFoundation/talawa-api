import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	__resetLastCleanupAtForTests,
	checkPasswordChangeRateLimit,
	PASSWORD_CHANGE_RATE_LIMITS,
	resetPasswordChangeRateLimit,
} from "~/src/utilities/passwordChangeRateLimit";

describe("passwordChangeRateLimit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Clear rate limit state between tests for isolation
		PASSWORD_CHANGE_RATE_LIMITS.clear();
		__resetLastCleanupAtForTests(0);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("checkPasswordChangeRateLimit", () => {
		it("should allow first request", () => {
			const userId = "user1";
			const result = checkPasswordChangeRateLimit(userId);
			expect(result).toBe(true);
		});

		it("should allow up to 3 requests within the window", () => {
			const userId = "user2";

			// First 3 requests should be allowed
			expect(checkPasswordChangeRateLimit(userId)).toBe(true);
			expect(checkPasswordChangeRateLimit(userId)).toBe(true);
			expect(checkPasswordChangeRateLimit(userId)).toBe(true);
		});

		it("should block 4th request within the same window", () => {
			const userId = "user3";

			// First 3 allowed
			for (let i = 0; i < 3; i++) {
				checkPasswordChangeRateLimit(userId);
			}

			// 4th should be blocked
			expect(checkPasswordChangeRateLimit(userId)).toBe(false);
		});

		it("should handle multiple users independently", () => {
			const userId1 = "user4";
			const userId2 = "user5";

			// User 1 makes 3 requests
			for (let i = 0; i < 3; i++) {
				checkPasswordChangeRateLimit(userId1);
			}

			// User 2 should still be allowed
			expect(checkPasswordChangeRateLimit(userId2)).toBe(true);

			// User 1 should be blocked on 4th
			expect(checkPasswordChangeRateLimit(userId1)).toBe(false);
		});

		it("should reset window after expiry", () => {
			const userId = "user6";
			const startTime = 1000000000;

			// Use fake timers for deterministic time control
			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// Make 3 requests
			for (let i = 0; i < 3; i++) {
				checkPasswordChangeRateLimit(userId);
			}

			// 4th should be blocked
			expect(checkPasswordChangeRateLimit(userId)).toBe(false);

			// Advance time by 1 hour + 1ms (window expired)
			vi.advanceTimersByTime(60 * 60 * 1000 + 1);

			// Should be allowed again (new window)
			expect(checkPasswordChangeRateLimit(userId)).toBe(true);

			// Restore real timers
			vi.useRealTimers();
		});

		it("should test exact window boundary at expiry time", () => {
			const userId = "user-boundary";
			const startTime = 2000000000;

			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// Make 3 requests
			for (let i = 0; i < 3; i++) {
				checkPasswordChangeRateLimit(userId);
			}

			// 4th blocked
			expect(checkPasswordChangeRateLimit(userId)).toBe(false);

			// Exactly at expiry (window just ends - still allowed as new window)
			vi.setSystemTime(startTime + 60 * 60 * 1000);
			expect(checkPasswordChangeRateLimit(userId)).toBe(true);

			// 1ms after expiry (new window starts)
			vi.setSystemTime(startTime + 60 * 60 * 1000 + 1);
			expect(checkPasswordChangeRateLimit(userId)).toBe(true);

			vi.useRealTimers();
		});
	});

	describe("cleanup mechanism", () => {
		it("should cleanup old entries", () => {
			const userId = "cleanup_test";
			const startTime = 1000000;

			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// create an entry
			checkPasswordChangeRateLimit(userId);
			expect(PASSWORD_CHANGE_RATE_LIMITS.has(userId)).toBe(true);

			// Advance time beyond cleanup threshold (2 hours)
			// Window is 1 hour, cleanup checks for > 2 hours
			vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1000);

			// Trigger cleanup (it runs every 5 minutes on check)
			checkPasswordChangeRateLimit("trigger_user");

			// Old entry should be gone
			expect(PASSWORD_CHANGE_RATE_LIMITS.has(userId)).toBe(false);

			vi.useRealTimers();
		});
	});

	describe("resetPasswordChangeRateLimit", () => {
		it("should reset rate limit for a specific user", () => {
			const userId = "user7";

			// Exhaust rate limit
			for (let i = 0; i < 3; i++) {
				checkPasswordChangeRateLimit(userId);
			}

			// Should be blocked
			expect(checkPasswordChangeRateLimit(userId)).toBe(false);

			// Reset
			resetPasswordChangeRateLimit(userId);

			// Should be allowed again
			expect(checkPasswordChangeRateLimit(userId)).toBe(true);
		});

		it("should not affect other users when resetting", () => {
			const userId1 = "user8";
			const userId2 = "user9";

			// Both make requests
			for (let i = 0; i < 3; i++) {
				checkPasswordChangeRateLimit(userId1);
				checkPasswordChangeRateLimit(userId2);
			}

			// Reset userId1
			resetPasswordChangeRateLimit(userId1);

			// userId1 should be allowed again
			expect(checkPasswordChangeRateLimit(userId1)).toBe(true);

			// userId2 should still be blocked
			expect(checkPasswordChangeRateLimit(userId2)).toBe(false);
		});
	});
});
