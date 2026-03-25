import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkPasswordChangeRateLimit,
	type RateLimitCache,
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

describe("passwordChangeRateLimit (Redis-backed)", () => {
	let mockCache: ReturnType<typeof createMockCache>;

	beforeEach(() => {
		mockCache = createMockCache();
	});

	describe("checkPasswordChangeRateLimit", () => {
		it("should allow first request", async () => {
			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, "user-1"),
			).resolves.toBeUndefined();

			expect(mockCache.cache.set).toHaveBeenCalledWith(
				"rate_limit:password_change:user-1",
				{ count: 1 },
				3600,
			);
		});

		it("should allow up to 3 requests", async () => {
			const userId = "user-2";

			await checkPasswordChangeRateLimit(mockCache.cache, userId);
			await checkPasswordChangeRateLimit(mockCache.cache, userId);
			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId),
			).resolves.toBeUndefined();
		});

		it("should block 4th request within the same window", async () => {
			const userId = "user-3";

			// First 3 allowed
			for (let i = 0; i < 3; i++) {
				await checkPasswordChangeRateLimit(mockCache.cache, userId);
			}

			// 4th should be blocked
			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId),
			).rejects.toThrow("Too many password change attempts");
		});

		it("should throw TalawaGraphQLError with too_many_requests code", async () => {
			const userId = "user-4";

			for (let i = 0; i < 3; i++) {
				await checkPasswordChangeRateLimit(mockCache.cache, userId);
			}

			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId),
			).rejects.toMatchObject({
				extensions: { code: "too_many_requests" },
			});
		});

		it("should handle multiple users independently", async () => {
			const userId1 = "user-5";
			const userId2 = "user-6";

			// User 1 exhausts rate limit
			for (let i = 0; i < 3; i++) {
				await checkPasswordChangeRateLimit(mockCache.cache, userId1);
			}

			// User 2 should still be allowed
			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId2),
			).resolves.toBeUndefined();

			// User 1 should be blocked
			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId1),
			).rejects.toThrow("Too many password change attempts");
		});

		it("should allow requests after cache entry expires (TTL simulation)", async () => {
			const userId = "user-7";

			// Exhaust rate limit
			for (let i = 0; i < 3; i++) {
				await checkPasswordChangeRateLimit(mockCache.cache, userId);
			}

			// Simulate TTL expiration by clearing the store entry
			mockCache.store.delete("rate_limit:password_change:user-7");

			// Should be allowed again (entry expired)
			await expect(
				checkPasswordChangeRateLimit(mockCache.cache, userId),
			).resolves.toBeUndefined();
		});

		it("should increment count on each call", async () => {
			const userId = "user-8";

			await checkPasswordChangeRateLimit(mockCache.cache, userId);
			// After first call: count = 1 (set is called with count: 1)
			expect(mockCache.cache.set).toHaveBeenLastCalledWith(
				"rate_limit:password_change:user-8",
				{ count: 1 },
				3600,
			);

			await checkPasswordChangeRateLimit(mockCache.cache, userId);
			// After second call: count = 2 (set is called with count: 2)
			expect(mockCache.cache.set).toHaveBeenLastCalledWith(
				"rate_limit:password_change:user-8",
				{ count: 2 },
				3600,
			);

			await checkPasswordChangeRateLimit(mockCache.cache, userId);
			// After third call: count = 3 (set is called with count: 3)
			expect(mockCache.cache.set).toHaveBeenLastCalledWith(
				"rate_limit:password_change:user-8",
				{ count: 3 },
				3600,
			);
		});
	});
});
