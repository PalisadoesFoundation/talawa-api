import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	__resetLastCleanupAtForTests,
	checkPasswordChangeRateLimit,
	consumePasswordChangeRateLimit,
	PASSWORD_CHANGE_RATE_LIMITS,
	resetPasswordChangeRateLimit,
} from "~/src/utilities/passwordChangeRateLimit";

describe("passwordChangeRateLimit", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
		// Clear rate limit state between tests for isolation
		PASSWORD_CHANGE_RATE_LIMITS.clear();
		__resetLastCleanupAtForTests(0);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	describe("checkPasswordChangeRateLimit", () => {
		it("should allow first request", () => {
			const userId = "user1";
			const result = checkPasswordChangeRateLimit(userId);
			expect(result).toBe(true);
		});

		it("should allow up to 3 consumed requests within the window", () => {
			const userId = "user2";

			for (let i = 0; i < 3; i++) {
				expect(checkPasswordChangeRateLimit(userId)).toBe(true);
				consumePasswordChangeRateLimit(userId);
			}
		});

		it("should block after 3 consumed requests within the same window", () => {
			const userId = "user3";

			for (let i = 0; i < 3; i++) {
				consumePasswordChangeRateLimit(userId);
			}

			expect(checkPasswordChangeRateLimit(userId)).toBe(false);
		});

		it("should not consume a slot on check alone", () => {
			const userId = "user-check-only";

			// Multiple checks without consume should all pass
			for (let i = 0; i < 10; i++) {
				expect(checkPasswordChangeRateLimit(userId)).toBe(true);
			}
		});

		it("should handle multiple users independently", () => {
			const userId1 = "user4";
			const userId2 = "user5";

			// User 1 consumes 3 slots
			for (let i = 0; i < 3; i++) {
				consumePasswordChangeRateLimit(userId1);
			}

			// User 2 should still be allowed
			expect(checkPasswordChangeRateLimit(userId2)).toBe(true);

			// User 1 should be blocked
			expect(checkPasswordChangeRateLimit(userId1)).toBe(false);
		});

		it("should reset window after expiry", () => {
			const userId = "user6";
			const startTime = 1000000000;

			vi.setSystemTime(startTime);

			for (let i = 0; i < 3; i++) {
				consumePasswordChangeRateLimit(userId);
			}

			expect(checkPasswordChangeRateLimit(userId)).toBe(false);

			// Advance time by 1 hour + 1ms (window expired)
			vi.advanceTimersByTime(60 * 60 * 1000 + 1);

			expect(checkPasswordChangeRateLimit(userId)).toBe(true);
		});

		it("should test exact window boundary at expiry time", () => {
			const userId = "user-boundary";
			const startTime = 2000000000;

			vi.setSystemTime(startTime);

			for (let i = 0; i < 3; i++) {
				consumePasswordChangeRateLimit(userId);
			}

			expect(checkPasswordChangeRateLimit(userId)).toBe(false);

			// Exactly at expiry (window just ends — allowed as new window)
			vi.setSystemTime(startTime + 60 * 60 * 1000);
			expect(checkPasswordChangeRateLimit(userId)).toBe(true);

			// 1ms after expiry (new window)
			vi.setSystemTime(startTime + 60 * 60 * 1000 + 1);
			expect(checkPasswordChangeRateLimit(userId)).toBe(true);
		});
	});

	describe("consumePasswordChangeRateLimit", () => {
		it("should create an entry on first consume", () => {
			const userId = "consume-first";

			consumePasswordChangeRateLimit(userId);

			expect(PASSWORD_CHANGE_RATE_LIMITS.has(userId)).toBe(true);
			expect(PASSWORD_CHANGE_RATE_LIMITS.get(userId)?.count).toBe(1);
		});

		it("should increment count on subsequent consumes", () => {
			const userId = "consume-inc";

			consumePasswordChangeRateLimit(userId);
			consumePasswordChangeRateLimit(userId);

			expect(PASSWORD_CHANGE_RATE_LIMITS.get(userId)?.count).toBe(2);
		});

		it("should reset window on consume after expiry", () => {
			const userId = "consume-expiry";
			const startTime = 1000000000;

			vi.setSystemTime(startTime);
			consumePasswordChangeRateLimit(userId);
			consumePasswordChangeRateLimit(userId);
			consumePasswordChangeRateLimit(userId);

			expect(PASSWORD_CHANGE_RATE_LIMITS.get(userId)?.count).toBe(3);

			// Advance past window
			vi.advanceTimersByTime(60 * 60 * 1000 + 1);
			consumePasswordChangeRateLimit(userId);

			// Should have reset to a new window with count 1
			expect(PASSWORD_CHANGE_RATE_LIMITS.get(userId)?.count).toBe(1);
		});
	});

	describe("cleanup mechanism", () => {
		it("should cleanup old entries", () => {
			const userId = "cleanup_test";
			const startTime = 1000000;

			vi.setSystemTime(startTime);

			consumePasswordChangeRateLimit(userId);
			expect(PASSWORD_CHANGE_RATE_LIMITS.has(userId)).toBe(true);

			// Advance time beyond cleanup threshold (2 hours)
			vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1000);

			// Trigger cleanup (it runs every 5 minutes on consume)
			consumePasswordChangeRateLimit("trigger_user");

			// Old entry should be gone
			expect(PASSWORD_CHANGE_RATE_LIMITS.has(userId)).toBe(false);
		});
	});

	describe("resetPasswordChangeRateLimit", () => {
		it("should reset rate limit for a specific user", () => {
			const userId = "user7";

			for (let i = 0; i < 3; i++) {
				consumePasswordChangeRateLimit(userId);
			}

			expect(checkPasswordChangeRateLimit(userId)).toBe(false);

			resetPasswordChangeRateLimit(userId);

			expect(checkPasswordChangeRateLimit(userId)).toBe(true);
		});

		it("should not affect other users when resetting", () => {
			const userId1 = "user8";
			const userId2 = "user9";

			for (let i = 0; i < 3; i++) {
				consumePasswordChangeRateLimit(userId1);
				consumePasswordChangeRateLimit(userId2);
			}

			resetPasswordChangeRateLimit(userId1);

			expect(checkPasswordChangeRateLimit(userId1)).toBe(true);
			expect(checkPasswordChangeRateLimit(userId2)).toBe(false);
		});
	});
});
