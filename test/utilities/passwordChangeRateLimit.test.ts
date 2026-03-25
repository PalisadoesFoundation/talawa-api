import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkPasswordChangeRateLimit,
	type RateLimitCache,
	type RateLimitLogger,
} from "~/src/utilities/passwordChangeRateLimit";

/**
 * Creates a mock cache backed by a simple in-memory Map for testing.
 * Simulates Redis get/set with TTL tracking.
 */
function createMockCache() {
	const store = new Map<string, string>();

	const cache: RateLimitCache = {
		get: vi.fn(async (key: string) => {
			const raw = store.get(key);
			return raw ? JSON.parse(raw) : null;
		}),
		set: vi.fn(async (key: string, value: unknown, _ttlSeconds: number) => {
			store.set(key, JSON.stringify(value));
		}),
	};

	return { store, cache };
}

function createMockLogger(): RateLimitLogger {
	return {
		warn: vi.fn(),
	};
}

describe("passwordChangeRateLimit (Redis-backed)", () => {
	let mockCache: ReturnType<typeof createMockCache>;
	let mockLogger: RateLimitLogger;

	beforeEach(() => {
		mockCache = createMockCache();
		mockLogger = createMockLogger();
	});

	describe("checkPasswordChangeRateLimit", () => {
		it("should allow first request", async () => {
			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, "user-1", mockLogger),
			).resolves.toBeUndefined();

			expect(mockCache.cache.set).toHaveBeenCalledWith(
				"rate_limit:password_change:user-1",
				expect.objectContaining({ count: 1 }),
				3600,
			);
		});

		it("should allow up to 3 requests (default limit)", async () => {
			const userId = "user-2";

			await checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger);
			await checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger);
			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger),
			).resolves.toBeUndefined();
		});

		it("should block 4th request within the same window", async () => {
			const userId = "user-3";

			for (let i = 0; i < 3; i++) {
				await checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger);
			}

			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger),
			).rejects.toThrow("Too many password change attempts");
		});

		it("should throw with too_many_requests code and httpStatus 429", async () => {
			const userId = "user-4";

			for (let i = 0; i < 3; i++) {
				await checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger);
			}

			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger),
			).rejects.toMatchObject({
				extensions: {
					code: "too_many_requests",
					httpStatus: 429,
				},
			});
		});

		it("should log rate limit violation with user context", async () => {
			const userId = "user-log";

			for (let i = 0; i < 3; i++) {
				await checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger);
			}

			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger),
			).rejects.toThrow();

			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					userId,
					attemptCount: 3,
					retryAfterSeconds: expect.any(Number),
				}),
				"Password change rate limit exceeded",
			);
		});

		it("should handle multiple users independently", async () => {
			const userId1 = "user-5";
			const userId2 = "user-6";

			for (let i = 0; i < 3; i++) {
				await checkPasswordChangeRateLimit(
					mockCache.cache,
					userId1,
					mockLogger,
				);
			}

			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId2, mockLogger),
			).resolves.toBeUndefined();

			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId1, mockLogger),
			).rejects.toThrow("Too many password change attempts");
		});

		it("should allow requests after cache entry expires (TTL simulation)", async () => {
			const userId = "user-7";

			for (let i = 0; i < 3; i++) {
				await checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger);
			}

			// Simulate TTL expiration by clearing the store entry
			mockCache.store.delete("rate_limit:password_change:user-7");

			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger),
			).resolves.toBeUndefined();
		});

		it("should use fixed window (preserve original expiresAt on increment)", async () => {
			const userId = "user-fixed-window";

			// First call sets the window
			await checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger);

			// Capture the expiresAt from the first set call
			const firstSetCall = (mockCache.cache.set as ReturnType<typeof vi.fn>)
				.mock.calls[0] as [
				string,
				{ count: number; expiresAt: number },
				number,
			];
			const originalExpiresAt = firstSetCall[1].expiresAt;

			// Second call should preserve the same expiresAt
			await checkPasswordChangeRateLimit(mockCache.cache, userId, mockLogger);

			const secondSetCall = (mockCache.cache.set as ReturnType<typeof vi.fn>)
				.mock.calls[1] as [
				string,
				{ count: number; expiresAt: number },
				number,
			];
			expect(secondSetCall[1].expiresAt).toBe(originalExpiresAt);
			expect(secondSetCall[1].count).toBe(2);
		});

		it("should respect custom maxChanges config", async () => {
			const userId = "user-custom";
			const config = { maxChanges: 1, windowSeconds: 300 };

			await checkPasswordChangeRateLimit(
				mockCache.cache,
				userId,
				mockLogger,
				config,
			);

			await expect(
				checkPasswordChangeRateLimit(
					mockCache.cache,
					userId,
					mockLogger,
					config,
				),
			).rejects.toThrow("Too many password change attempts");
		});
	});
});
