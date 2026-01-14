import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { metricsCacheProxy } from "../../../src/services/metrics/metricsCacheProxy";

describe("metricsCacheProxy", () => {
	let mockCache: {
		get: Mock<(key: string) => Promise<unknown>>;
		mget?: Mock<(keys: string[]) => Promise<unknown[]>>;
		set: Mock<(key: string, value: unknown, ttl: number) => Promise<unknown>>;
		del: Mock<(keys: string | string[]) => Promise<unknown>>;
	};
	let mockPerf: {
		trackCacheHit: Mock<() => void>;
		trackCacheMiss: Mock<() => void>;
	};

	beforeEach(() => {
		mockCache = {
			get: vi.fn(),
			mget: vi.fn(),
			set: vi.fn(),
			del: vi.fn(),
		};

		mockPerf = {
			trackCacheHit: vi.fn(),
			trackCacheMiss: vi.fn(),
		};
	});

	describe("get", () => {
		it("tracks cache hit when value is found", async () => {
			mockCache.get.mockResolvedValue("test-value");
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.get("test-key");

			expect(result).toBe("test-value");
			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(1);
			expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
		});

		it("tracks cache miss when value is null", async () => {
			mockCache.get.mockResolvedValue(null);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.get("test-key");

			expect(result).toBeNull();
			expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(1);
			expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
		});

		it("normalizes undefined to null and tracks miss", async () => {
			mockCache.get.mockResolvedValue(undefined);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.get("test-key");

			expect(result).toBeNull();
			expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(1);
			expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
		});

		it("treats falsy but non-null values as hits", async () => {
			mockCache.get.mockResolvedValue(0);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.get("test-key");

			expect(result).toBe(0);
			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(1);
		});

		it("handles object values correctly", async () => {
			const obj = { id: 1 };
			mockCache.get.mockResolvedValue(obj);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.get<typeof obj>("test-key");

			expect(result).toEqual(obj);
			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(1);
		});
	});

	describe("mget", () => {
		it("tracks hits and misses using native mget", async () => {
			mockCache.mget?.mockResolvedValue(["v1", null, "v3", null]);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.mget(["k1", "k2", "k3", "k4"]);

			expect(result).toEqual(["v1", null, "v3", null]);
			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(2);
			expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(2);
		});

		it("normalizes undefined values to null", async () => {
			mockCache.mget?.mockResolvedValue(["v1", undefined, null, "v4"]);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.mget(["k1", "k2", "k3", "k4"]);

			expect(result).toEqual(["v1", null, null, "v4"]);
			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(2);
			expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(2);
		});

		it("tracks all hits when all keys found", async () => {
			mockCache.mget?.mockResolvedValue(["a", "b", "c"]);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.mget(["k1", "k2", "k3"]);

			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(3);
			expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
		});

		it("tracks all misses when no keys found", async () => {
			mockCache.mget?.mockResolvedValue([null, null]);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.mget(["k1", "k2"]);

			expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
			expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(2);
		});

		it("falls back to individual get calls when mget is not available", async () => {
			const cacheWithoutMget = {
				get: vi
					.fn()
					.mockResolvedValueOnce("v1")
					.mockResolvedValueOnce(undefined)
					.mockResolvedValueOnce("v3"),
				set: vi.fn(),
				del: vi.fn(),
			};

			const proxy = metricsCacheProxy(cacheWithoutMget, mockPerf);

			const result = await proxy.mget(["k1", "k2", "k3"]);

			expect(result).toEqual(["v1", null, "v3"]);
			expect(cacheWithoutMget.get).toHaveBeenCalledTimes(3);
			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(2);
			expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(1);
		});

		it("handles empty key array without tracking metrics", async () => {
			mockCache.mget?.mockResolvedValue([]);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.mget([]);

			expect(result).toEqual([]);
			expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
			expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
		});
	});

	describe("set", () => {
		it("delegates to underlying cache", async () => {
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.set("key", "value", 60);

			expect(mockCache.set).toHaveBeenCalledWith("key", "value", 60);
			expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
			expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
		});
	});

	describe("del", () => {
		it("delegates delete for single key", async () => {
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.del("key");

			expect(mockCache.del).toHaveBeenCalledWith("key");
		});

		it("delegates delete for multiple keys", async () => {
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.del(["k1", "k2"]);

			expect(mockCache.del).toHaveBeenCalledWith(["k1", "k2"]);
		});

		it("does not track metrics on delete", async () => {
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.del("key");

			expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
			expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
		});
	});
});
