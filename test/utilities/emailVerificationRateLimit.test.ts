import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Import the rate limit map for testing cleanup
import {
	checkEmailVerificationRateLimit,
	EMAIL_VERIFICATION_RATE_LIMITS,
	resetEmailVerificationRateLimit,
} from "~/src/utilities/emailVerificationRateLimit";

describe("emailVerificationRateLimit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Clear rate limit state between tests for isolation
		EMAIL_VERIFICATION_RATE_LIMITS.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("checkEmailVerificationRateLimit", () => {
		it("should allow first request", () => {
			const userId = "user-1";
			const result = checkEmailVerificationRateLimit(userId);
			expect(result).toBe(true);
		});

		it("should allow up to 3 requests within the window", () => {
			const userId = "user-2";

			// First 3 requests should be allowed
			expect(checkEmailVerificationRateLimit(userId)).toBe(true);
			expect(checkEmailVerificationRateLimit(userId)).toBe(true);
			expect(checkEmailVerificationRateLimit(userId)).toBe(true);
		});

		it("should block 4th request within the same window", () => {
			const userId = "user-3";

			// First 3 allowed
			checkEmailVerificationRateLimit(userId);
			checkEmailVerificationRateLimit(userId);
			checkEmailVerificationRateLimit(userId);

			// 4th should be blocked
			expect(checkEmailVerificationRateLimit(userId)).toBe(false);
		});

		it("should handle multiple users independently", () => {
			const user1 = "user-4";
			const user2 = "user-5";

			// User 1 makes 3 requests
			checkEmailVerificationRateLimit(user1);
			checkEmailVerificationRateLimit(user1);
			checkEmailVerificationRateLimit(user1);

			// User 2 should still be allowed
			expect(checkEmailVerificationRateLimit(user2)).toBe(true);

			// User 1 should be blocked on 4th
			expect(checkEmailVerificationRateLimit(user1)).toBe(false);
		});

		it("should reset window after expiry", () => {
			const userId = "user-6";
			const startTime = 1000000000;

			// Use fake timers for deterministic time control
			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// Make 3 requests
			checkEmailVerificationRateLimit(userId);
			checkEmailVerificationRateLimit(userId);
			checkEmailVerificationRateLimit(userId);

			// 4th should be blocked
			expect(checkEmailVerificationRateLimit(userId)).toBe(false);

			// Advance time by 1 hour + 1ms (window expired)
			vi.advanceTimersByTime(60 * 60 * 1000 + 1);

			// Should be allowed again (new window)
			expect(checkEmailVerificationRateLimit(userId)).toBe(true);

			// Restore real timers
			vi.useRealTimers();
		});

		it("should test exact window boundary at expiry time", () => {
			const userId = "user-boundary";
			const startTime = 2000000000;

			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// Make 3 requests
			checkEmailVerificationRateLimit(userId);
			checkEmailVerificationRateLimit(userId);
			checkEmailVerificationRateLimit(userId);

			// 4th blocked
			expect(checkEmailVerificationRateLimit(userId)).toBe(false);

			// Exactly at expiry (window just ends - still allowed as new window)
			vi.setSystemTime(startTime + 60 * 60 * 1000);
			expect(checkEmailVerificationRateLimit(userId)).toBe(true);

			// 1ms after expiry (new window starts)
			vi.setSystemTime(startTime + 60 * 60 * 1000 + 1);
			expect(checkEmailVerificationRateLimit(userId)).toBe(true);

			vi.useRealTimers();
		});
	});

	describe("resetEmailVerificationRateLimit", () => {
		it("should reset rate limit for a specific user", () => {
			const userId = "user-7";

			// Exhaust rate limit
			checkEmailVerificationRateLimit(userId);
			checkEmailVerificationRateLimit(userId);
			checkEmailVerificationRateLimit(userId);

			// Should be blocked
			expect(checkEmailVerificationRateLimit(userId)).toBe(false);

			// Reset
			resetEmailVerificationRateLimit(userId);

			// Should be allowed again
			expect(checkEmailVerificationRateLimit(userId)).toBe(true);
		});

		it("should not affect other users when resetting", () => {
			const user1 = "user-8";
			const user2 = "user-9";

			// Both make 3 requests
			checkEmailVerificationRateLimit(user1);
			checkEmailVerificationRateLimit(user1);
			checkEmailVerificationRateLimit(user1);

			checkEmailVerificationRateLimit(user2);
			checkEmailVerificationRateLimit(user2);
			checkEmailVerificationRateLimit(user2);

			// Reset user1
			resetEmailVerificationRateLimit(user1);

			// User1 should be allowed again
			expect(checkEmailVerificationRateLimit(user1)).toBe(true);

			// User2 should still be blocked
			expect(checkEmailVerificationRateLimit(user2)).toBe(false);
		});
	});
});
