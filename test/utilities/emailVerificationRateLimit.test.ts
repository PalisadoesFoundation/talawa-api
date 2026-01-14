import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkEmailVerificationRateLimit,
	resetEmailVerificationRateLimit,
} from "~/src/utilities/emailVerificationRateLimit";

describe("emailVerificationRateLimit", () => {
	beforeEach(() => {
		// Reset all rate limits before each test
		vi.clearAllMocks();
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

			// Mock Date.now for time control
			const originalDateNow = Date.now;
			const startTime = 1000000000;

			// Set initial time
			Date.now = vi.fn(() => startTime);

			// Make 3 requests
			checkEmailVerificationRateLimit(userId);
			checkEmailVerificationRateLimit(userId);
			checkEmailVerificationRateLimit(userId);

			// 4th should be blocked
			expect(checkEmailVerificationRateLimit(userId)).toBe(false);

			// Advance time by 1 hour + 1ms (window expired)
			Date.now = vi.fn(() => startTime + 60 * 60 * 1000 + 1);

			// Should be allowed again (new window)
			expect(checkEmailVerificationRateLimit(userId)).toBe(true);

			// Restore original Date.now
			Date.now = originalDateNow;
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
