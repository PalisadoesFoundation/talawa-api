import { describe, expect, it, vi } from "vitest";
import type { CacheService } from "~/src/services/caching/CacheService";
import { metricsCacheProxy } from "~/src/services/caching/metricsCacheProxy";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

describe("metricsCacheProxy", () => {
	it("should track cache hits on successful get", async () => {
		const mockCache = {
			get: vi.fn(async () => ({ id: "123", name: "Test" })),
			set: vi.fn(),
			del: vi.fn(),
			clearByPattern: vi.fn(),
			mget: vi.fn(),
			mset: vi.fn(),
		} as any as CacheService;

		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const proxy = metricsCacheProxy(mockCache, mockPerf);
		const result = await proxy.get("test-key");

		expect(result).toEqual({ id: "123", name: "Test" });
		expect(mockCache.get).toHaveBeenCalledWith("test-key");
		expect(mockPerf.start).toHaveBeenCalledWith("cache:get");
		expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(1);
		expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
	});

	it("should track cache misses on null get", async () => {
		const mockCache: CacheService = {
			get: vi.fn(async () => null),
			set: vi.fn(),
			del: vi.fn(),
			clearByPattern: vi.fn(),
			mget: vi.fn(),
			mset: vi.fn(),
		};

		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const proxy = metricsCacheProxy(mockCache, mockPerf);
		const result = await proxy.get("missing-key");

		expect(result).toBeNull();
		expect(mockCache.get).toHaveBeenCalledWith("missing-key");
		expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(1);
		expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
	});

	it("should track timing for set operation", async () => {
		const mockCache: CacheService = {
			get: vi.fn(),
			set: vi.fn(async () => {}),
			del: vi.fn(),
			clearByPattern: vi.fn(),
			mget: vi.fn(),
			mset: vi.fn(),
		};

		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const proxy = metricsCacheProxy(mockCache, mockPerf);
		await proxy.set("test-key", { data: "value" }, 300);

		expect(mockCache.set).toHaveBeenCalledWith("test-key", { data: "value" }, 300);
		expect(mockPerf.time).toHaveBeenCalledWith("cache:set", expect.any(Function));
	});

	it("should track timing for del operation", async () => {
		const mockCache: CacheService = {
			get: vi.fn(),
			set: vi.fn(),
			del: vi.fn(async () => {}),
			clearByPattern: vi.fn(),
			mget: vi.fn(),
			mset: vi.fn(),
		};

		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const proxy = metricsCacheProxy(mockCache, mockPerf);
		await proxy.del(["key1", "key2"]);

		expect(mockCache.del).toHaveBeenCalledWith(["key1", "key2"]);
		expect(mockPerf.time).toHaveBeenCalledWith("cache:del", expect.any(Function));
	});

	it("should track timing for clearByPattern operation", async () => {
		const mockCache: CacheService = {
			get: vi.fn(),
			set: vi.fn(),
			del: vi.fn(),
			clearByPattern: vi.fn(async () => {}),
			mget: vi.fn(),
			mset: vi.fn(),
		};

		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const proxy = metricsCacheProxy(mockCache, mockPerf);
		await proxy.clearByPattern("talawa:v1:user:*");

		expect(mockCache.clearByPattern).toHaveBeenCalledWith("talawa:v1:user:*");
		expect(mockPerf.time).toHaveBeenCalledWith(
			"cache:clearByPattern",
			expect.any(Function),
		);
	});

	it("should track hits and misses for mget operation", async () => {
		const mockCache = {
			get: vi.fn(),
			set: vi.fn(),
			del: vi.fn(),
			clearByPattern: vi.fn(),
			mget: vi.fn(async () => [{ id: "1" }, null, { id: "3" }]),
			mset: vi.fn(),
		} as any as CacheService;

		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const proxy = metricsCacheProxy(mockCache, mockPerf);
		const results = await proxy.mget(["key1", "key2", "key3"]);

		expect(results).toEqual([{ id: "1" }, null, { id: "3" }]);
		expect(mockCache.mget).toHaveBeenCalledWith(["key1", "key2", "key3"]);
		expect(mockPerf.start).toHaveBeenCalledWith("cache:mget");
		// 2 hits (non-null values), 1 miss (null value)
		expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(2);
		expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(1);
	});

	it("should track timing for mset operation", async () => {
		const mockCache: CacheService = {
			get: vi.fn(),
			set: vi.fn(),
			del: vi.fn(),
			clearByPattern: vi.fn(),
			mget: vi.fn(),
			mset: vi.fn(async () => {}),
		};

		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const entries = [
			{ key: "key1", value: { data: "1" }, ttlSeconds: 300 },
			{ key: "key2", value: { data: "2" }, ttlSeconds: 300 },
		];

		const proxy = metricsCacheProxy(mockCache, mockPerf);
		await proxy.mset(entries);

		expect(mockCache.mset).toHaveBeenCalledWith(entries);
		expect(mockPerf.time).toHaveBeenCalledWith("cache:mset", expect.any(Function));
	});

	it("should handle get operation errors gracefully", async () => {
		const mockCache: CacheService = {
			get: vi.fn(async () => {
				throw new Error("Redis connection failed");
			}),
			set: vi.fn(),
			del: vi.fn(),
			clearByPattern: vi.fn(),
			mget: vi.fn(),
			mset: vi.fn(),
		};

		const endFn = vi.fn();
		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => endFn),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const proxy = metricsCacheProxy(mockCache, mockPerf);

		await expect(proxy.get("test-key")).rejects.toThrow(
			"Redis connection failed",
		);

		// Should still call end function to track timing
		expect(endFn).toHaveBeenCalled();
	});

	it("should handle all nulls in mget", async () => {
		const mockCache: CacheService = {
			get: vi.fn(),
			set: vi.fn(),
			del: vi.fn(),
			clearByPattern: vi.fn(),
			mget: vi.fn(async () => [null, null, null]),
			mset: vi.fn(),
		};

		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const proxy = metricsCacheProxy(mockCache, mockPerf);
		await proxy.mget(["key1", "key2", "key3"]);

		// All misses
		expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
		expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(3);
	});

	it("should handle all hits in mget", async () => {
		const mockCache = {
			get: vi.fn(),
			set: vi.fn(),
			del: vi.fn(),
			clearByPattern: vi.fn(),
			mget: vi.fn(async () => [{ id: "1" }, { id: "2" }, { id: "3" }]),
			mset: vi.fn(),
		} as any as CacheService;

		const mockPerf: PerformanceTracker = {
			time: vi.fn(async (_op, fn) => fn()),
			start: vi.fn(() => vi.fn()),
			trackDb: vi.fn(),
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
			snapshot: vi.fn(() => ({
				totalMs: 0,
				cacheHits: 0,
				cacheMisses: 0,
				ops: {},
			})),
		};

		const proxy = metricsCacheProxy(mockCache, mockPerf);
		await proxy.mget(["key1", "key2", "key3"]);

		// All hits
		expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(3);
		expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
	});
});
