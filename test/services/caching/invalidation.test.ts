import { describe, expect, it, vi } from "vitest";
import type { CacheService } from "~/src/services/caching/CacheService";
import {
	invalidateEntity,
	invalidateEntityLists,
} from "~/src/services/caching/invalidation";

/**
 * Create a mock CacheService for testing.
 */
function createMockCache(): CacheService & {
	del: ReturnType<typeof vi.fn>;
	clearByPattern: ReturnType<typeof vi.fn>;
} {
	return {
		get: vi.fn(),
		set: vi.fn(),
		del: vi.fn().mockResolvedValue(undefined),
		clearByPattern: vi.fn().mockResolvedValue(undefined),
		mget: vi.fn(),
		mset: vi.fn(),
	};
}

describe("invalidation helpers", () => {
	describe("invalidateEntity", () => {
		it("should call cache.del with correct entity key", async () => {
			const cache = createMockCache();

			await invalidateEntity(cache, "user", "abc123");

			expect(cache.del).toHaveBeenCalledWith("talawa:v1:user:abc123");
			expect(cache.del).toHaveBeenCalledTimes(1);
		});

		it("should handle number IDs", async () => {
			const cache = createMockCache();

			await invalidateEntity(cache, "organization", 456);

			expect(cache.del).toHaveBeenCalledWith("talawa:v1:organization:456");
		});

		it("should work with different entity types", async () => {
			const cache = createMockCache();

			await invalidateEntity(cache, "event", "e1");
			await invalidateEntity(cache, "post", "p1");

			expect(cache.del).toHaveBeenNthCalledWith(1, "talawa:v1:event:e1");
			expect(cache.del).toHaveBeenNthCalledWith(2, "talawa:v1:post:p1");
		});
		it("should propagate errors from cache.del", async () => {
			const cache = createMockCache();
			const error = new Error("Redis connection failed");
			cache.del.mockRejectedValue(error);

			await expect(invalidateEntity(cache, "user", "123")).rejects.toThrow(
				"Redis connection failed",
			);
		});
	});

	describe("invalidateEntityLists", () => {
		it("should call cache.clearByPattern with correct list pattern", async () => {
			const cache = createMockCache();

			await invalidateEntityLists(cache, "organization");

			expect(cache.clearByPattern).toHaveBeenCalledWith(
				"talawa:v1:organization:list:*",
			);
			expect(cache.clearByPattern).toHaveBeenCalledTimes(1);
		});

		it("should work with different entity types", async () => {
			const cache = createMockCache();

			await invalidateEntityLists(cache, "user");
			await invalidateEntityLists(cache, "event");

			expect(cache.clearByPattern).toHaveBeenNthCalledWith(
				1,
				"talawa:v1:user:list:*",
			);
			expect(cache.clearByPattern).toHaveBeenNthCalledWith(
				2,
				"talawa:v1:event:list:*",
			);
		});

		it("should propagate errors from cache.clearByPattern", async () => {
			const cache = createMockCache();
			const error = new Error("Redis connection failed");
			cache.clearByPattern.mockRejectedValue(error);

			await expect(invalidateEntityLists(cache, "user")).rejects.toThrow(
				"Redis connection failed",
			);
		});
	});
});
