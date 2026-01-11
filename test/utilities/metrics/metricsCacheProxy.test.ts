import { beforeEach, describe, expect, it, vi } from "vitest";
import { metricsCacheProxy } from "../../../src/services/metrics/metricsCacheProxy";

describe("metricsCacheProxy", () => {
	let mockCache: {
		get: ReturnType<typeof vi.fn>;
		mget?: ReturnType<typeof vi.fn>;
		set: ReturnType<typeof vi.fn>;
		del: ReturnType<typeof vi.fn>;
	};
	let mockPerf: {
		trackCacheHit: ReturnType<typeof vi.fn>;
		trackCacheMiss: ReturnType<typeof vi.fn>;
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
		it("should track cache hit when value is found", async () => {
			mockCache.get.mockResolvedValue("test-value");
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.get("test-key");

			expect(result).toBe("test-value");
			expect(mockCache.get).toHaveBeenCalledWith("test-key");
			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(1);
			expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
		});

		it("should track cache miss when value is null", async () => {
			mockCache.get.mockResolvedValue(null);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.get("test-key");

			expect(result).toBeNull();
			expect(mockCache.get).toHaveBeenCalledWith("test-key");
			expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(1);
			expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
		});

		it("should handle objects as cache values", async () => {
			const testObject = { id: 1, name: "test" };
			mockCache.get.mockResolvedValue(testObject);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.get("test-key");

			expect(result).toEqual(testObject);
			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(1);
		});

		it("should track cache hit for falsy non-null values", async () => {
			mockCache.get.mockResolvedValue(0);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.get("test-key");

			expect(result).toBe(0);
			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(1);
			expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
		});
	});

	describe("mget", () => {
		it("should track hits and misses for multiple keys using mget", async () => {
			mockCache.mget?.mockResolvedValue(["value1", null, "value3", null]);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.mget(["key1", "key2", "key3", "key4"]);

			expect(result).toEqual(["value1", null, "value3", null]);
			expect(mockCache.mget).toHaveBeenCalledWith([
				"key1",
				"key2",
				"key3",
				"key4",
			]);
			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(2);
			expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(2);
		});

		it("should track all hits when all keys found", async () => {
			mockCache.mget?.mockResolvedValue(["value1", "value2", "value3"]);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.mget(["key1", "key2", "key3"]);

			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(3);
			expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
		});

		it("should track all misses when no keys found", async () => {
			mockCache.mget?.mockResolvedValue([null, null, null]);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.mget(["key1", "key2", "key3"]);

			expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
			expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(3);
		});

		it("should fallback to individual get calls when mget is not available", async () => {
			const cacheWithoutMget: {
				get: ReturnType<typeof vi.fn>;
				set: ReturnType<typeof vi.fn>;
				del: ReturnType<typeof vi.fn>;
			} = {
				get: vi.fn(),
				set: vi.fn(),
				del: vi.fn(),
			};
			cacheWithoutMget.get
				.mockResolvedValueOnce("value1")
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce("value3");

			const proxy = metricsCacheProxy(cacheWithoutMget, mockPerf);

			const result = await proxy.mget(["key1", "key2", "key3"]);

			expect(result).toEqual(["value1", null, "value3"]);
			expect(cacheWithoutMget.get).toHaveBeenCalledTimes(3);
			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(2);
			expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(1);
		});

		it("should handle empty keys array", async () => {
			mockCache.mget?.mockResolvedValue([]);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.mget([]);

			expect(result).toEqual([]);
			expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
			expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
		});

		it("should handle mixed null and undefined values", async () => {
			mockCache.mget?.mockResolvedValue(["value1", null, undefined, "value4"]);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			const result = await proxy.mget(["key1", "key2", "key3", "key4"]);

			expect(result).toEqual(["value1", null, undefined, "value4"]);
			expect(mockPerf.trackCacheHit).toHaveBeenCalledTimes(2);
			expect(mockPerf.trackCacheMiss).toHaveBeenCalledTimes(2);
		});
	});

	describe("set", () => {
		it("should call underlying cache set method", async () => {
			mockCache.set.mockResolvedValue(undefined);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.set("test-key", "test-value", 3600);

			expect(mockCache.set).toHaveBeenCalledWith(
				"test-key",
				"test-value",
				3600,
			);
		});

		it("should handle object values", async () => {
			const testObject = { id: 1, data: "test" };
			mockCache.set.mockResolvedValue(undefined);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.set("test-key", testObject, 3600);

			expect(mockCache.set).toHaveBeenCalledWith("test-key", testObject, 3600);
		});

		it("should not track cache hits or misses on set", async () => {
			mockCache.set.mockResolvedValue(undefined);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.set("test-key", "test-value", 3600);

			expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
			expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
		});
	});

	describe("del", () => {
		it("should delete single key", async () => {
			mockCache.del.mockResolvedValue(1);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.del("test-key");

			expect(mockCache.del).toHaveBeenCalledWith("test-key");
		});

		it("should delete multiple keys", async () => {
			mockCache.del.mockResolvedValue(3);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.del(["key1", "key2", "key3"]);

			expect(mockCache.del).toHaveBeenCalledWith(["key1", "key2", "key3"]);
		});

		it("should not track cache hits or misses on delete", async () => {
			mockCache.del.mockResolvedValue(1);
			const proxy = metricsCacheProxy(mockCache, mockPerf);

			await proxy.del("test-key");

			expect(mockPerf.trackCacheHit).not.toHaveBeenCalled();
			expect(mockPerf.trackCacheMiss).not.toHaveBeenCalled();
		});
	});
});
