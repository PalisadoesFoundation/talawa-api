/**
 * Tests for Cache proxy wrapper that automatically tracks cache operations.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CacheService } from "~/src/services/caching/CacheService";
import { wrapCacheWithMetrics } from "~/src/utilities/metrics/cacheProxy";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";

/**
 * Mock CacheService implementation for testing.
 */
class MockCacheService implements CacheService {
	private store = new Map<string, { value: unknown; ttl: number }>();

	async get<T>(key: string): Promise<T | null> {
		const entry = this.store.get(key);
		if (!entry) return null;
		return entry.value as T;
	}

	async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
		this.store.set(key, { value, ttl: ttlSeconds });
	}

	async del(keys: string | string[]): Promise<void> {
		const keysArray = Array.isArray(keys) ? keys : [keys];
		for (const key of keysArray) {
			this.store.delete(key);
		}
	}

	async clearByPattern(pattern: string): Promise<void> {
		// First replace '*' with a placeholder to preserve them
		// Then escape all regex metacharacters
		// Finally replace placeholder back to '.*' for regex wildcard
		const placeholder = "__STAR_PLACEHOLDER__";
		const escapedPattern = pattern
			.replace(/\*/g, placeholder)
			.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
			.replace(
				new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
				".*",
			);
		const regex = new RegExp(`^${escapedPattern}$`);
		for (const key of this.store.keys()) {
			if (regex.test(key)) {
				this.store.delete(key);
			}
		}
	}

	async mget<T>(keys: string[]): Promise<(T | null)[]> {
		return Promise.all(keys.map((key) => this.get<T>(key)));
	}

	async mset<T>(
		entries: Array<{ key: string; value: T; ttlSeconds: number }>,
	): Promise<void> {
		for (const entry of entries) {
			await this.set(entry.key, entry.value, entry.ttlSeconds);
		}
	}
}

describe("wrapCacheWithMetrics", () => {
	let mockCache: CacheService;
	let mockPerf: ReturnType<typeof createPerformanceTracker>;
	let getPerf: () => typeof mockPerf | undefined;

	beforeEach(() => {
		vi.clearAllMocks();
		mockCache = new MockCacheService();
		mockPerf = createPerformanceTracker();
		getPerf = () => mockPerf;
	});

	describe("Zero Overhead", () => {
		it("should return proxy that forwards calls when perf is undefined", async () => {
			const getPerfUndefined = () => undefined;
			const wrapped = wrapCacheWithMetrics(mockCache, getPerfUndefined);

			// Should be a proxy (not the same reference), but should work identically
			expect(wrapped).not.toBe(mockCache);
			// Should still work - forward to original cache
			await mockCache.set("test-key", "test-value", 300);
			const result = await wrapped.get<string>("test-key");
			expect(result).toBe("test-value");
		});

		it("should return proxy that forwards calls when perf getter returns undefined", async () => {
			const wrapped = wrapCacheWithMetrics(mockCache, () => undefined);

			// Should be a proxy, but should work identically
			expect(wrapped).not.toBe(mockCache);
			// Should still work - forward to original cache
			await mockCache.set("test-key2", "test-value2", 300);
			const result = await wrapped.get<string>("test-key2");
			expect(result).toBe("test-value2");
		});
	});

	describe("get() - Hit/Miss Tracking", () => {
		it("should track cache hits", async () => {
			await mockCache.set("key1", { value: "test" }, 300);

			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			const result = await wrapped.get<{ value: string }>("key1");

			expect(result).toEqual({ value: "test" });

			const snapshot = mockPerf.snapshot();
			expect(snapshot.cacheHits).toBe(1);
			expect(snapshot.cacheMisses).toBe(0);
			expect(snapshot.hitRate).toBe(1.0);
			expect(snapshot.ops["cache:get"]).toBeDefined();
			if (snapshot.ops["cache:get"]) {
				expect(snapshot.ops["cache:get"].count).toBe(1);
			}
		});

		it("should track cache misses", async () => {
			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			const result = await wrapped.get("nonexistent");

			expect(result).toBeNull();

			const snapshot = mockPerf.snapshot();
			expect(snapshot.cacheHits).toBe(0);
			expect(snapshot.cacheMisses).toBe(1);
			expect(snapshot.hitRate).toBe(0);
		});

		it("should track timing for get operations", async () => {
			await mockCache.set("key1", "value1", 300);

			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			await wrapped.get("key1");

			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["cache:get"];
			expect(op).toBeDefined();
			if (op) {
				expect(op.count).toBe(1);
				expect(op.ms).toBeGreaterThanOrEqual(0);
			}
		});
	});

	describe("set() - Timing Tracking", () => {
		it("should track timing for set operations", async () => {
			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			await wrapped.set("key1", { value: "test" }, 300);

			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["cache:set"];
			expect(op).toBeDefined();
			if (op) {
				expect(op.count).toBe(1);
				expect(op.ms).toBeGreaterThanOrEqual(0);
			}
		});

		it("should not track hits/misses for set operations", async () => {
			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			await wrapped.set("key1", "value1", 300);

			const snapshot = mockPerf.snapshot();
			expect(snapshot.cacheHits).toBe(0);
			expect(snapshot.cacheMisses).toBe(0);
		});
	});

	describe("del() - Timing Tracking", () => {
		it("should track timing for del operations with single key", async () => {
			await mockCache.set("key1", "value1", 300);

			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			await wrapped.del("key1");

			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["cache:del"];
			expect(op).toBeDefined();
			if (op) {
				expect(op.count).toBe(1);
			}
		});

		it("should track timing for del operations with multiple keys", async () => {
			await mockCache.set("key1", "value1", 300);
			await mockCache.set("key2", "value2", 300);

			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			await wrapped.del(["key1", "key2"]);

			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["cache:del"];
			expect(op).toBeDefined();
			if (op) {
				expect(op.count).toBe(1);
			}
		});
	});

	describe("clearByPattern() - Timing Tracking", () => {
		it("should track timing for clearByPattern operations", async () => {
			await mockCache.set("prefix:key1", "value1", 300);
			await mockCache.set("prefix:key2", "value2", 300);

			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			await wrapped.clearByPattern("prefix:*");

			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["cache:clearByPattern"];
			expect(op).toBeDefined();
			if (op) {
				expect(op.count).toBe(1);
			}
		});
	});

	describe("mget() - Hit/Miss Tracking", () => {
		it("should track hits and misses for each key in mget", async () => {
			await mockCache.set("key1", "value1", 300);
			// key2 is not set (will be a miss)

			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			const results = await wrapped.mget<string>(["key1", "key2"]);

			expect(results[0]).toBe("value1");
			expect(results[1]).toBeNull();

			const snapshot = mockPerf.snapshot();
			expect(snapshot.cacheHits).toBe(1);
			expect(snapshot.cacheMisses).toBe(1);
			expect(snapshot.hitRate).toBe(0.5);
			const op = snapshot.ops["cache:mget"];
			expect(op).toBeDefined();
			if (op) {
				expect(op.count).toBe(1);
			}
		});

		it("should track all hits in mget", async () => {
			await mockCache.set("key1", "value1", 300);
			await mockCache.set("key2", "value2", 300);

			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			await wrapped.mget<string>(["key1", "key2"]);

			const snapshot = mockPerf.snapshot();
			expect(snapshot.cacheHits).toBe(2);
			expect(snapshot.cacheMisses).toBe(0);
			expect(snapshot.hitRate).toBe(1.0);
		});

		it("should track all misses in mget", async () => {
			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			await wrapped.mget<string>(["key1", "key2"]);

			const snapshot = mockPerf.snapshot();
			expect(snapshot.cacheHits).toBe(0);
			expect(snapshot.cacheMisses).toBe(2);
			expect(snapshot.hitRate).toBe(0);
		});
	});

	describe("mset() - Timing Tracking", () => {
		it("should track timing for mset operations", async () => {
			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			await wrapped.mset([
				{ key: "key1", value: "value1", ttlSeconds: 300 },
				{ key: "key2", value: "value2", ttlSeconds: 300 },
			]);

			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["cache:mset"];
			expect(op).toBeDefined();
			if (op) {
				expect(op.count).toBe(1);
			}
		});

		it("should not track hits/misses for mset operations", async () => {
			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			await wrapped.mset([{ key: "key1", value: "value1", ttlSeconds: 300 }]);

			const snapshot = mockPerf.snapshot();
			expect(snapshot.cacheHits).toBe(0);
			expect(snapshot.cacheMisses).toBe(0);
		});
	});

	describe("Operation Counting", () => {
		it("should count multiple operations correctly", async () => {
			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);

			await wrapped.set("key1", "value1", 300);
			await wrapped.get("key1");
			await wrapped.get("key2"); // miss
			await wrapped.del("key1");

			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["cache:set"]?.count).toBe(1);
			expect(snapshot.ops["cache:get"]?.count).toBe(2);
			expect(snapshot.ops["cache:del"]?.count).toBe(1);
			expect(snapshot.totalOps).toBe(4);
		});
	});

	describe("Error Handling", () => {
		it("should propagate errors from cache operations", async () => {
			const errorCache: CacheService = {
				async get() {
					throw new Error("Cache connection failed");
				},
				async set() {
					throw new Error("Cache connection failed");
				},
				async del() {
					throw new Error("Cache connection failed");
				},
				async clearByPattern() {
					throw new Error("Cache connection failed");
				},
				async mget() {
					throw new Error("Cache connection failed");
				},
				async mset() {
					throw new Error("Cache connection failed");
				},
			};

			const wrapped = wrapCacheWithMetrics(errorCache, getPerf);

			await expect(wrapped.get("key1")).rejects.toThrow(
				"Cache connection failed",
			);

			// Operation should still be tracked even if it failed
			const snapshot = mockPerf.snapshot();
			expect(snapshot.ops["cache:get"]).toBeDefined();
		});
	});

	describe("Perf Getter Function", () => {
		it("should call getPerf function at runtime for each operation", async () => {
			const getPerfSpy = vi.fn(() => mockPerf);

			const wrapped = wrapCacheWithMetrics(mockCache, getPerfSpy);
			await wrapped.get("key1");
			await wrapped.set("key2", "value2", 300);

			// getPerf should be called for each operation
			expect(getPerfSpy).toHaveBeenCalledTimes(2);
		});

		it("should handle getPerf returning undefined mid-request", async () => {
			let callCount = 0;
			const getPerfDynamic = () => {
				callCount++;
				// Return undefined on second call
				return callCount === 2 ? undefined : mockPerf;
			};

			const wrapped = wrapCacheWithMetrics(mockCache, getPerfDynamic);
			await wrapped.get("key1"); // First call - tracked
			await wrapped.get("key2"); // Second call - not tracked

			const snapshot = mockPerf.snapshot();
			// Only first operation should be tracked
			const op = snapshot.ops["cache:get"];
			if (op) {
				expect(op.count).toBe(1);
			}
		});
	});

	describe("Cache Behavior Preservation", () => {
		it("should preserve original cache behavior", async () => {
			await mockCache.set("key1", { name: "test" }, 300);

			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			const result = await wrapped.get<{ name: string }>("key1");

			expect(result).toEqual({ name: "test" });
		});

		it("should preserve mget order", async () => {
			await mockCache.set("key1", "value1", 300);
			await mockCache.set("key3", "value3", 300);
			// key2 is missing

			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			const results = await wrapped.mget<string>(["key1", "key2", "key3"]);

			expect(results).toEqual(["value1", null, "value3"]);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty mget array", async () => {
			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			const results = await wrapped.mget<string>([]);

			expect(results).toEqual([]);
			const snapshot = mockPerf.snapshot();
			expect(snapshot.cacheHits).toBe(0);
			expect(snapshot.cacheMisses).toBe(0);
			const op = snapshot.ops["cache:mget"];
			if (op) {
				expect(op.count).toBe(1);
			}
		});

		it("should handle empty mset array", async () => {
			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			await wrapped.mset([]);

			const snapshot = mockPerf.snapshot();
			const op = snapshot.ops["cache:mset"];
			if (op) {
				expect(op.count).toBe(1);
			}
		});

		it("should handle get when perf becomes undefined during operation", async () => {
			let callCount = 0;
			const getPerfDynamic = () => {
				callCount++;
				// Return undefined on second call (during the time() call)
				return callCount === 2 ? undefined : mockPerf;
			};

			await mockCache.set("key1", "value1", 300);

			const wrapped = wrapCacheWithMetrics(mockCache, getPerfDynamic);
			const result = await wrapped.get("key1");

			// Should still work, but tracking may be incomplete
			expect(result).toBe("value1");
		});

		it("should handle set when perf becomes undefined during operation", async () => {
			let callCount = 0;
			const getPerfDynamic = () => {
				callCount++;
				return callCount === 2 ? undefined : mockPerf;
			};

			const wrapped = wrapCacheWithMetrics(mockCache, getPerfDynamic);
			await wrapped.set("key1", "value1", 300);

			// Should still work
			expect(await mockCache.get("key1")).toBe("value1");
		});

		it("should handle del when perf becomes undefined during operation", async () => {
			let callCount = 0;
			const getPerfDynamic = () => {
				callCount++;
				return callCount === 2 ? undefined : mockPerf;
			};

			await mockCache.set("key1", "value1", 300);

			const wrapped = wrapCacheWithMetrics(mockCache, getPerfDynamic);
			await wrapped.del("key1");

			// Should still work
			expect(await mockCache.get("key1")).toBeNull();
		});

		it("should handle clearByPattern when perf becomes undefined during operation", async () => {
			let callCount = 0;
			const getPerfDynamic = () => {
				callCount++;
				return callCount === 2 ? undefined : mockPerf;
			};

			await mockCache.set("prefix:key1", "value1", 300);

			const wrapped = wrapCacheWithMetrics(mockCache, getPerfDynamic);
			await wrapped.clearByPattern("prefix:*");

			// Should still work
			expect(await mockCache.get("prefix:key1")).toBeNull();
		});

		it("should handle mget when perf becomes undefined during operation", async () => {
			let callCount = 0;
			const getPerfDynamic = () => {
				callCount++;
				return callCount === 2 ? undefined : mockPerf;
			};

			await mockCache.set("key1", "value1", 300);

			const wrapped = wrapCacheWithMetrics(mockCache, getPerfDynamic);
			const results = await wrapped.mget<string>(["key1", "key2"]);

			// Should still work
			expect(results).toEqual(["value1", null]);
		});

		it("should handle mset when perf becomes undefined during operation", async () => {
			let callCount = 0;
			const getPerfDynamic = () => {
				callCount++;
				return callCount === 2 ? undefined : mockPerf;
			};

			const wrapped = wrapCacheWithMetrics(mockCache, getPerfDynamic);
			await wrapped.mset([{ key: "key1", value: "value1", ttlSeconds: 300 }]);

			// Should still work
			expect(await mockCache.get("key1")).toBe("value1");
		});
	});

	describe("Proxy Traps", () => {
		it("should support 'in' operator via has trap", async () => {
			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			// Test that 'has' trap works - properties should be accessible
			expect("get" in wrapped).toBe(true);
			expect("set" in wrapped).toBe(true);
			expect("del" in wrapped).toBe(true);
			expect("mget" in wrapped).toBe(true);
			expect("mset" in wrapped).toBe(true);
			expect("clearByPattern" in wrapped).toBe(true);
		});

		it("should support Object.keys() via ownKeys trap", async () => {
			const wrapped = wrapCacheWithMetrics(mockCache, getPerf);
			// Test that ownKeys trap works - should return cache method names
			const keys = Object.keys(wrapped);
			expect(keys).toContain("get");
			expect(keys).toContain("set");
			expect(keys).toContain("del");
			expect(keys).toContain("mget");
			expect(keys).toContain("mset");
			expect(keys).toContain("clearByPattern");
		});

		it("should forward non-function properties from original cache", async () => {
			// Create a cache with a custom property
			const cacheWithProperty = {
				...mockCache,
				customProperty: "test-value",
			} as CacheService & { customProperty: string };

			const wrapped = wrapCacheWithMetrics(
				cacheWithProperty,
				getPerf,
			) as typeof cacheWithProperty;

			// Non-function properties should be accessible
			expect(wrapped.customProperty).toBe("test-value");
		});
	});
});
