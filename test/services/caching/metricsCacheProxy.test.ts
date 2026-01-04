import { describe, expect, it, vi } from "vitest";
import type { CacheService } from "~/src/services/caching/CacheService";
import { metricsCacheProxy } from "~/src/services/caching/metricsCacheProxy";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

/**
 * Create a mock CacheService for testing.
 */
function createMockCache(): CacheService & {
	get: ReturnType<typeof vi.fn>;
	set: ReturnType<typeof vi.fn>;
	del: ReturnType<typeof vi.fn>;
	clearByPattern: ReturnType<typeof vi.fn>;
	mget: ReturnType<typeof vi.fn>;
	mset: ReturnType<typeof vi.fn>;
} {
	return {
		get: vi.fn(),
		set: vi.fn().mockResolvedValue(undefined),
		del: vi.fn().mockResolvedValue(undefined),
		clearByPattern: vi.fn().mockResolvedValue(undefined),
		mget: vi.fn(),
		mset: vi.fn().mockResolvedValue(undefined),
	};
}

describe("metricsCacheProxy", () => {
	it("should track cache hits on get", async () => {
		const cache = createMockCache();
		cache.get.mockResolvedValue({ data: "test" });
		const perf = createPerformanceTracker();

		const proxy = metricsCacheProxy(cache, perf);

		await proxy.get("key1");

		expect(cache.get).toHaveBeenCalledWith("key1");
		const snapshot = perf.snapshot();
		expect(snapshot.cacheHits).toBe(1);
		expect(snapshot.cacheMisses).toBe(0);
	});

	it("should track cache misses on get", async () => {
		const cache = createMockCache();
		cache.get.mockResolvedValue(null);
		const perf = createPerformanceTracker();

		const proxy = metricsCacheProxy(cache, perf);

		await proxy.get("key1");

		expect(cache.get).toHaveBeenCalledWith("key1");
		const snapshot = perf.snapshot();
		expect(snapshot.cacheHits).toBe(0);
		expect(snapshot.cacheMisses).toBe(1);
	});

	it("should pass through set operations", async () => {
		const cache = createMockCache();
		const perf = createPerformanceTracker();

		const proxy = metricsCacheProxy(cache, perf);

		await proxy.set("key1", { data: "test" }, 300);

		expect(cache.set).toHaveBeenCalledWith("key1", { data: "test" }, 300);
		const snapshot = perf.snapshot();
		expect(snapshot.cacheHits).toBe(0);
		expect(snapshot.cacheMisses).toBe(0);
	});

	it("should pass through del operations", async () => {
		const cache = createMockCache();
		const perf = createPerformanceTracker();

		const proxy = metricsCacheProxy(cache, perf);

		await proxy.del("key1");

		expect(cache.del).toHaveBeenCalledWith("key1");
	});

	it("should pass through del operations with array", async () => {
		const cache = createMockCache();
		const perf = createPerformanceTracker();

		const proxy = metricsCacheProxy(cache, perf);

		await proxy.del(["key1", "key2"]);

		expect(cache.del).toHaveBeenCalledWith(["key1", "key2"]);
	});

	it("should pass through clearByPattern operations", async () => {
		const cache = createMockCache();
		const perf = createPerformanceTracker();

		const proxy = metricsCacheProxy(cache, perf);

		await proxy.clearByPattern("pattern:*");

		expect(cache.clearByPattern).toHaveBeenCalledWith("pattern:*");
	});

	it("should track hits and misses in mget", async () => {
		const cache = createMockCache();
		cache.mget.mockResolvedValue([{ data: "test1" }, null, { data: "test3" }]);
		const perf = createPerformanceTracker();

		const proxy = metricsCacheProxy(cache, perf);

		const result = await proxy.mget(["key1", "key2", "key3"]);

		expect(cache.mget).toHaveBeenCalledWith(["key1", "key2", "key3"]);
		expect(result).toEqual([{ data: "test1" }, null, { data: "test3" }]);

		const snapshot = perf.snapshot();
		expect(snapshot.cacheHits).toBe(2);
		expect(snapshot.cacheMisses).toBe(1);
	});

	it("should track all hits in mget", async () => {
		const cache = createMockCache();
		cache.mget.mockResolvedValue([
			{ data: "test1" },
			{ data: "test2" },
			{ data: "test3" },
		]);
		const perf = createPerformanceTracker();

		const proxy = metricsCacheProxy(cache, perf);

		await proxy.mget(["key1", "key2", "key3"]);

		const snapshot = perf.snapshot();
		expect(snapshot.cacheHits).toBe(3);
		expect(snapshot.cacheMisses).toBe(0);
	});

	it("should track all misses in mget", async () => {
		const cache = createMockCache();
		cache.mget.mockResolvedValue([null, null, null]);
		const perf = createPerformanceTracker();

		const proxy = metricsCacheProxy(cache, perf);

		await proxy.mget(["key1", "key2", "key3"]);

		const snapshot = perf.snapshot();
		expect(snapshot.cacheHits).toBe(0);
		expect(snapshot.cacheMisses).toBe(3);
	});

	it("should pass through mset operations", async () => {
		const cache = createMockCache();
		const perf = createPerformanceTracker();

		const proxy = metricsCacheProxy(cache, perf);

		await proxy.mset([
			{ key: "key1", value: { data: "test1" }, ttlSeconds: 300 },
			{ key: "key2", value: { data: "test2" }, ttlSeconds: 300 },
		]);

		expect(cache.mset).toHaveBeenCalledWith([
			{ key: "key1", value: { data: "test1" }, ttlSeconds: 300 },
			{ key: "key2", value: { data: "test2" }, ttlSeconds: 300 },
		]);
	});

	it("should accumulate metrics across multiple operations", async () => {
		const cache = createMockCache();
		cache.get.mockResolvedValueOnce({ data: "test1" });
		cache.get.mockResolvedValueOnce(null);
		cache.mget.mockResolvedValue([{ data: "test2" }, null]);
		const perf = createPerformanceTracker();

		const proxy = metricsCacheProxy(cache, perf);

		await proxy.get("key1");
		await proxy.get("key2");
		await proxy.mget(["key3", "key4"]);

		const snapshot = perf.snapshot();
		expect(snapshot.cacheHits).toBe(2); // 1 from get, 1 from mget
		expect(snapshot.cacheMisses).toBe(2); // 1 from get, 1 from mget
	});
});
