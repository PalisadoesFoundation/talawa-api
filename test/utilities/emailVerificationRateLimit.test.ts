import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Import the rate limit map for testing cleanup
import {
	checkEmailVerificationRateLimit,
	EMAIL_VERIFICATION_RATE_LIMITS,
	resetEmailVerificationRateLimit,
	__resetLastCleanupAtForTests,
} from "~/src/utilities/emailVerificationRateLimit";

describe("emailVerificationRateLimit", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Clear rate limit state between tests for isolation
		EMAIL_VERIFICATION_RATE_LIMITS.clear();
		// Reset cleanup timer to prevent test pollution from previous tests
		__resetLastCleanupAtForTests();
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

	describe("cleanup mechanism", () => {
		it("should trigger cleanup at CLEANUP_INTERVAL_MS (5 minutes)", () => {
			const userId1 = "cleanup-user-1";
			const userId2 = "cleanup-user-2";
			const startTime = 3000000000;

			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// Add first entry
			checkEmailVerificationRateLimit(userId1);

			// Move time forward by less than CLEANUP_INTERVAL_MS (5 minutes)
			vi.setSystemTime(startTime + 4 * 60 * 1000); // 4 minutes

			// Add second entry
			checkEmailVerificationRateLimit(userId2);

			// Both entries should still exist (no cleanup triggered)
			expect(EMAIL_VERIFICATION_RATE_LIMITS.has(userId1)).toBe(true);
			expect(EMAIL_VERIFICATION_RATE_LIMITS.has(userId2)).toBe(true);

			// Move to exactly 5 minutes + 1ms (cleanup should trigger)
			vi.setSystemTime(startTime + 5 * 60 * 1000 + 1);

			// Make a request to trigger cleanup check
			checkEmailVerificationRateLimit("new-user");

			// Both original entries should still exist because they're not old enough
			expect(EMAIL_VERIFICATION_RATE_LIMITS.has(userId1)).toBe(true);
			expect(EMAIL_VERIFICATION_RATE_LIMITS.has(userId2)).toBe(true);

			vi.useRealTimers();
		});

		it("should remove entries older than 2 * RATE_LIMIT_WINDOW_MS during cleanup", () => {
			const oldUserId = "old-user";
			const newUserId = "new-user-cleanup";
			const startTime = 4000000000;

			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// Manually create an old entry by setting a very old windowStart
			EMAIL_VERIFICATION_RATE_LIMITS.set(oldUserId, {
				count: 1,
				windowStart: startTime - 60 * 60 * 1000 * 2 - 1000, // More than 2 hours old
			});

			// Reset cleanup timer so cleanup will trigger on next request
			__resetLastCleanupAtForTests();

			// Move time forward by more than CLEANUP_INTERVAL_MS
			vi.setSystemTime(startTime + 5 * 60 * 1000 + 1);

			// Make a new request to trigger cleanup
			checkEmailVerificationRateLimit(newUserId);

			// Old entry should be deleted
			expect(EMAIL_VERIFICATION_RATE_LIMITS.has(oldUserId)).toBe(false);

			// New entry should exist
			expect(EMAIL_VERIFICATION_RATE_LIMITS.has(newUserId)).toBe(true);

			vi.useRealTimers();
		});

		it("should not remove entries within cleanup threshold", () => {
			const userId = "threshold-user";
			const startTime = 5000000000;

			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// Create entry at start time
			checkEmailVerificationRateLimit(userId);

			// Move time forward to just within the threshold (less than 2 * RATE_LIMIT_WINDOW_MS)
			vi.setSystemTime(startTime + 60 * 60 * 1000 + 1); // 1 hour + 1ms

			// Reset cleanup timer to allow cleanup to trigger
			__resetLastCleanupAtForTests();

			// Move time forward to trigger cleanup
			vi.setSystemTime(startTime + 60 * 60 * 1000 + 5 * 60 * 1000 + 1);

			// Make request to trigger cleanup
			checkEmailVerificationRateLimit("another-user");

			// Original entry should still exist (only 1 hour + 5 minutes old, threshold is 2 hours)
			expect(EMAIL_VERIFICATION_RATE_LIMITS.has(userId)).toBe(true);

			vi.useRealTimers();
		});

		it("should handle multiple expired entries during single cleanup", () => {
			const oldUser1 = "old-user-1";
			const oldUser2 = "old-user-2";
			const recentUser = "recent-user";
			const startTime = 6000000000;

			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// Create multiple old entries
			EMAIL_VERIFICATION_RATE_LIMITS.set(oldUser1, {
				count: 2,
				windowStart: startTime - 60 * 60 * 1000 * 2 - 5000,
			});
			EMAIL_VERIFICATION_RATE_LIMITS.set(oldUser2, {
				count: 3,
				windowStart: startTime - 60 * 60 * 1000 * 2 - 1000,
			});

			// Create a recent entry
			vi.setSystemTime(startTime);
			checkEmailVerificationRateLimit(recentUser);

			// Reset cleanup timer
			__resetLastCleanupAtForTests();

			// Move time forward to trigger cleanup
			vi.setSystemTime(startTime + 5 * 60 * 1000 + 1);

			// Trigger cleanup
			checkEmailVerificationRateLimit("new-user-cleanup");

			// Both old entries should be deleted
			expect(EMAIL_VERIFICATION_RATE_LIMITS.has(oldUser1)).toBe(false);
			expect(EMAIL_VERIFICATION_RATE_LIMITS.has(oldUser2)).toBe(false);

			// Recent entry should still exist
			expect(EMAIL_VERIFICATION_RATE_LIMITS.has(recentUser)).toBe(true);

			vi.useRealTimers();
		});

		it("should not trigger cleanup multiple times within CLEANUP_INTERVAL_MS", () => {
			const userId1 = "cleanup-freq-1";
			const userId2 = "cleanup-freq-2";
			const startTime = 7000000000;

			vi.useFakeTimers();
			vi.setSystemTime(startTime);

			// Add first entry
			checkEmailVerificationRateLimit(userId1);

			// Move forward by less than CLEANUP_INTERVAL_MS
			vi.setSystemTime(startTime + 60 * 1000); // 1 minute

			// Add second entry
			checkEmailVerificationRateLimit(userId2);

			// Move forward another minute (still less than 5 minutes total)
			vi.setSystemTime(startTime + 2 * 60 * 1000);

			// Both entries should still exist
			expect(EMAIL_VERIFICATION_RATE_LIMITS.size).toBe(2);

			vi.useRealTimers();
		});
	});
});
