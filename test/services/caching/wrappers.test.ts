import { describe, expect, it, vi } from "vitest";
import type { CacheService } from "~/src/services/caching/CacheService";
import { wrapWithCache } from "~/src/services/caching/wrappers";

/**
 * Create a mock CacheService for testing.
 */
function createMockCache(cacheData: Map<string, unknown> = new Map()) {
	return {
		get: vi.fn(),
		set: vi.fn(),
		del: vi.fn(),
		clearByPattern: vi.fn(),
		mget: vi.fn().mockImplementation(async (keys: string[]) => {
			return keys.map((k) => cacheData.get(k) ?? null);
		}),
		mset: vi
			.fn()
			.mockImplementation(
				async (
					entries: Array<{ key: string; value: unknown; ttlSeconds: number }>,
				) => {
					for (const e of entries) {
						cacheData.set(e.key, e.value);
					}
				},
			),
	} as unknown as CacheService & {
		mget: ReturnType<typeof vi.fn>;
		mset: ReturnType<typeof vi.fn>;
	};
}

describe("wrapWithCache", () => {
	describe("cache hit scenarios", () => {
		it("should return cached values without calling producer", async () => {
			const cacheData = new Map([
				["talawa:v1:user:1", { id: "1", name: "Alice" }],
				["talawa:v1:user:2", { id: "2", name: "Bob" }],
			]);
			const cache = createMockCache(cacheData);

			const producer = vi.fn();
			const wrappedFn = wrapWithCache(producer, {
				cache,
				entity: "user",
				keyFn: (id: string) => id,
				ttlSeconds: 300,
			});

			const results = await wrappedFn(["1", "2"]);

			expect(results).toEqual([
				{ id: "1", name: "Alice" },
				{ id: "2", name: "Bob" },
			]);
			expect(producer).not.toHaveBeenCalled();
		});
	});

	describe("cache miss scenarios", () => {
		it("should fetch and cache missing values", async () => {
			const cache = createMockCache();

			const producer = vi.fn().mockResolvedValue([
				{ id: "1", name: "Alice" },
				{ id: "2", name: "Bob" },
			]);

			const wrappedFn = wrapWithCache(producer, {
				cache,
				entity: "user",
				keyFn: (id: string) => id,
				ttlSeconds: 300,
			});

			const results = await wrappedFn(["1", "2"]);

			expect(results).toEqual([
				{ id: "1", name: "Alice" },
				{ id: "2", name: "Bob" },
			]);
			expect(producer).toHaveBeenCalledWith(["1", "2"]);
			expect(cache.mset).toHaveBeenCalledWith([
				{
					key: "talawa:v1:user:1",
					value: { id: "1", name: "Alice" },
					ttlSeconds: 300,
				},
				{
					key: "talawa:v1:user:2",
					value: { id: "2", name: "Bob" },
					ttlSeconds: 300,
				},
			]);
		});
	});

	describe("mixed hit/miss scenarios", () => {
		it("should handle partial cache hits correctly", async () => {
			const cacheData = new Map([
				["talawa:v1:user:1", { id: "1", name: "Alice" }],
				// user:2 not cached
				["talawa:v1:user:3", { id: "3", name: "Charlie" }],
			]);
			const cache = createMockCache(cacheData);

			const producer = vi.fn().mockResolvedValue([{ id: "2", name: "Bob" }]);

			const wrappedFn = wrapWithCache(producer, {
				cache,
				entity: "user",
				keyFn: (id: string) => id,
				ttlSeconds: 300,
			});

			const results = await wrappedFn(["1", "2", "3"]);

			// Results should be in correct order
			expect(results).toEqual([
				{ id: "1", name: "Alice" }, // from cache
				{ id: "2", name: "Bob" }, // fetched
				{ id: "3", name: "Charlie" }, // from cache
			]);

			// Producer should only be called with missing key
			expect(producer).toHaveBeenCalledWith(["2"]);

			// Only the fetched value should be cached
			expect(cache.mset).toHaveBeenCalledWith([
				{
					key: "talawa:v1:user:2",
					value: { id: "2", name: "Bob" },
					ttlSeconds: 300,
				},
			]);
		});
	});

	describe("null value handling", () => {
		it("should not cache null values from producer", async () => {
			const cache = createMockCache();

			const producer = vi
				.fn()
				.mockResolvedValue([{ id: "1", name: "Alice" }, null]);

			const wrappedFn = wrapWithCache(producer, {
				cache,
				entity: "user",
				keyFn: (id: string) => id,
				ttlSeconds: 300,
			});

			const results = await wrappedFn(["1", "2"]);

			expect(results).toEqual([{ id: "1", name: "Alice" }, null]);

			// Only non-null value should be cached
			expect(cache.mset).toHaveBeenCalledWith([
				{
					key: "talawa:v1:user:1",
					value: { id: "1", name: "Alice" },
					ttlSeconds: 300,
				},
			]);
		});
	});

	describe("order preservation", () => {
		it("should maintain key order in results", async () => {
			const cacheData = new Map([
				["talawa:v1:user:3", { id: "3", name: "Charlie" }],
			]);
			const cache = createMockCache(cacheData);

			const producer = vi.fn().mockResolvedValue([
				{ id: "1", name: "Alice" },
				{ id: "2", name: "Bob" },
			]);

			const wrappedFn = wrapWithCache(producer, {
				cache,
				entity: "user",
				keyFn: (id: string) => id,
				ttlSeconds: 300,
			});

			const results = await wrappedFn(["1", "3", "2"]);

			// Order must match input keys
			expect(results[0]).toEqual({ id: "1", name: "Alice" });
			expect(results[1]).toEqual({ id: "3", name: "Charlie" });
			expect(results[2]).toEqual({ id: "2", name: "Bob" });
		});
	});

	describe("cache failure scenarios", () => {
		it("should fall back to producer if cache.mget fails", async () => {
			const cache = createMockCache();
			const error = new Error("Redis connection failed");
			cache.mget.mockRejectedValue(error);

			const producer = vi.fn().mockResolvedValue([{ id: "1", name: "Alice" }]);

			const wrappedFn = wrapWithCache(producer, {
				cache,
				entity: "user",
				keyFn: (id: string) => id,
				ttlSeconds: 300,
			});

			// Cache failure should fall back to producer gracefully
			const results = await wrappedFn(["1"]);
			expect(results).toEqual([{ id: "1", name: "Alice" }]);
			expect(producer).toHaveBeenCalledWith(["1"]);
		});

		it("should return results even if cache.mset fails", async () => {
			const cache = createMockCache();
			const error = new Error("Redis connection failed");
			cache.mset.mockRejectedValue(error);

			const producer = vi.fn().mockResolvedValue([{ id: "1", name: "Alice" }]);

			const wrappedFn = wrapWithCache(producer, {
				cache,
				entity: "user",
				keyFn: (id: string) => id,
				ttlSeconds: 300,
			});

			// mset failure should not prevent returning results
			const results = await wrappedFn(["1"]);
			expect(results).toEqual([{ id: "1", name: "Alice" }]);
			expect(producer).toHaveBeenCalledWith(["1"]);
		});

		it("should handle cache unavailable (Redis down) gracefully if service catches errors", async () => {
			const cache = createMockCache();
			// degraded mode: mget returns nulls (misses) but doesn't throw
			cache.mget.mockResolvedValue([null, null]);
			// degraded mode: mset swallows errors
			cache.mset.mockResolvedValue(undefined);

			const producer = vi.fn().mockResolvedValue([
				{ id: "1", name: "Alice" },
				{ id: "2", name: "Bob" },
			]);

			const wrappedFn = wrapWithCache(producer, {
				cache,
				entity: "user",
				keyFn: (id: string) => id,
				ttlSeconds: 300,
			});

			const results = await wrappedFn(["1", "2"]);

			// Should act like a full cache miss
			expect(results).toEqual([
				{ id: "1", name: "Alice" },
				{ id: "2", name: "Bob" },
			]);
			expect(producer).toHaveBeenCalledWith(["1", "2"]);
		});

		it("should call logger.debug when cache.mget fails", async () => {
			const cache = createMockCache();
			const error = new Error("Redis connection failed");
			cache.mget.mockRejectedValue(error);

			const mockLogger = { debug: vi.fn() };
			const mockMetrics = { increment: vi.fn() };

			const producer = vi.fn().mockResolvedValue([{ id: "1", name: "Alice" }]);

			const wrappedFn = wrapWithCache(producer, {
				cache,
				entity: "user",
				keyFn: (id: string) => id,
				ttlSeconds: 300,
				logger: mockLogger,
				metrics: mockMetrics,
			});

			await wrappedFn(["1"]);

			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "cache.read.failure",
					entity: "user",
					err: error,
				}),
				expect.any(String),
			);
			expect(mockMetrics.increment).toHaveBeenCalledWith("cache.read.failure", {
				entity: "user",
			});
		});

		it("should call logger.debug when cache.mset fails", async () => {
			const cache = createMockCache();
			const error = new Error("Redis connection failed");
			cache.mset.mockRejectedValue(error);

			const mockLogger = { debug: vi.fn() };
			const mockMetrics = { increment: vi.fn() };

			const producer = vi.fn().mockResolvedValue([{ id: "1", name: "Alice" }]);

			const wrappedFn = wrapWithCache(producer, {
				cache,
				entity: "user",
				keyFn: (id: string) => id,
				ttlSeconds: 300,
				logger: mockLogger,
				metrics: mockMetrics,
			});

			await wrappedFn(["1"]);

			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "cache.write.failure",
					entity: "user",
					ttlSeconds: 300,
					err: error,
				}),
				expect.any(String),
			);
			expect(mockMetrics.increment).toHaveBeenCalledWith(
				"cache.write.failure",
				{ entity: "user" },
			);
		});
	});
});
