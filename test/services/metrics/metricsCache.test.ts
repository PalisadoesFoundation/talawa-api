import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CacheService } from "~/src/services/caching/CacheService";
import { MetricsCacheService } from "~/src/services/metrics/metricsCache";
import type { AggregatedMetrics } from "~/src/workers/metrics/types";

/**
 * Mock CacheService implementation for testing.
 */
class MockCacheService implements CacheService {
	store = new Map<string, { value: unknown; ttl: number }>();
	operations: Array<{
		op: string;
		key?: string;
		value?: unknown;
		ttl?: number;
	}> = [];

	async get<T>(key: string): Promise<T | null> {
		this.operations.push({ op: "get", key });
		const entry = this.store.get(key);
		if (!entry) return null;
		return entry.value as T;
	}

	async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
		this.operations.push({ op: "set", key, value, ttl: ttlSeconds });
		this.store.set(key, { value, ttl: ttlSeconds });
	}

	async del(keys: string | string[]): Promise<void> {
		const keyArray = Array.isArray(keys) ? keys : [keys];
		this.operations.push({ op: "del", key: keyArray.join(",") });
		for (const key of keyArray) {
			this.store.delete(key);
		}
	}

	async clearByPattern(pattern: string): Promise<void> {
		this.operations.push({ op: "clearByPattern", key: pattern });
		const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
		for (const key of this.store.keys()) {
			if (regex.test(key)) {
				this.store.delete(key);
			}
		}
	}

	async mget<T>(keys: string[]): Promise<(T | null)[]> {
		this.operations.push({ op: "mget", key: keys.join(",") });
		return Promise.all(keys.map((k) => this.get<T>(k)));
	}

	async mset<T>(
		entries: Array<{ key: string; value: T; ttlSeconds: number }>,
	): Promise<void> {
		this.operations.push({ op: "mset" });
		for (const entry of entries) {
			await this.set(entry.key, entry.value, entry.ttlSeconds);
		}
	}
}

/**
 * Mock logger for testing.
 */
const mockLogger = {
	debug: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
};

/**
 * Sample aggregated metrics for testing.
 */
function createSampleMetrics(): AggregatedMetrics {
	return {
		timestamp: Date.now(),
		windowMinutes: 5,
		snapshotCount: 10,
		requests: {
			count: 10,
			avgTotalMs: 150,
			minTotalMs: 50,
			maxTotalMs: 300,
			medianTotalMs: 150,
			p95TotalMs: 280,
			p99TotalMs: 295,
		},
		cache: {
			totalHits: 8,
			totalMisses: 2,
			hitRate: 0.8,
			totalOps: 10,
		},
		operations: [
			{
				operation: "db",
				count: 10,
				totalMs: 1000,
				avgMs: 100,
				minMaxMs: 80,
				maxMaxMs: 150,
				medianMs: 100,
				p95Ms: 140,
				p99Ms: 148,
			},
		],
		slowOperations: {
			count: 2,
			byOperation: {
				db: 2,
			},
		},
	};
}

describe("MetricsCacheService", () => {
	let cache: MockCacheService;
	let metricsCache: MetricsCacheService;

	beforeEach(() => {
		cache = new MockCacheService();
		metricsCache = new MetricsCacheService(cache, mockLogger, 300);
		vi.clearAllMocks();
		cache.operations = [];
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("cacheAggregatedMetrics", () => {
		it("should cache metrics with timestamp key", async () => {
			const metrics = createSampleMetrics();
			const timestamp = "1705320000000";

			await metricsCache.cacheAggregatedMetrics(metrics, timestamp);

			expect(cache.operations).toHaveLength(1);
			expect(cache.operations[0]).toMatchObject({
				op: "set",
				key: "talawa:v1:metrics:aggregated:1705320000000",
			});
			const cached = await cache.get<AggregatedMetrics>(
				"talawa:v1:metrics:aggregated:1705320000000",
			);
			expect(cached).toEqual(metrics);
		});

		it("should use default TTL when not provided", async () => {
			const metrics = createSampleMetrics();
			const timestamp = "1705320000000";

			await metricsCache.cacheAggregatedMetrics(metrics, timestamp);

			expect(cache.operations[0]).toMatchObject({
				op: "set",
				ttl: 300, // default TTL
			});
		});

		it("should use custom TTL when provided", async () => {
			const metrics = createSampleMetrics();
			const timestamp = "1705320000000";

			await metricsCache.cacheAggregatedMetrics(metrics, timestamp, 600);

			expect(cache.operations[0]).toMatchObject({
				op: "set",
				ttl: 600,
			});
		});

		it("should handle cache set failures gracefully", async () => {
			const metrics = createSampleMetrics();
			const timestamp = "1705320000000";

			// Make cache.set throw an error
			const originalSet = cache.set.bind(cache);
			cache.set = vi.fn().mockRejectedValue(new Error("Cache error"));

			await metricsCache.cacheAggregatedMetrics(metrics, timestamp);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "metrics cache: set failed",
					timestamp,
				}),
				"Failed to cache aggregated metrics",
			);
			// Should not throw
			cache.set = originalSet;
		});

		it("should skip caching when metrics is null", async () => {
			await metricsCache.cacheAggregatedMetrics(
				null as unknown as AggregatedMetrics,
				"1705320000000",
			);

			expect(cache.operations).toHaveLength(0);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "metrics cache: invalid input",
					hasMetrics: false,
				}),
				"Skipping cache operation due to invalid input",
			);
		});

		it("should skip caching when timestamp is empty", async () => {
			const metrics = createSampleMetrics();

			await metricsCache.cacheAggregatedMetrics(metrics, "");

			expect(cache.operations).toHaveLength(0);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "metrics cache: invalid input",
					hasTimestamp: false,
				}),
				"Skipping cache operation due to invalid input",
			);
		});

		it("should log debug message on successful cache", async () => {
			const metrics = createSampleMetrics();
			const timestamp = "1705320000000";

			await metricsCache.cacheAggregatedMetrics(metrics, timestamp);

			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					key: "talawa:v1:metrics:aggregated:1705320000000",
					ttlSeconds: 300,
					timestamp,
				}),
				"Metrics cached successfully",
			);
		});
	});

	describe("getCachedMetrics", () => {
		it("should retrieve cached metrics by timestamp", async () => {
			const metrics = createSampleMetrics();
			const timestamp = "1705320000000";
			await cache.set(
				"talawa:v1:metrics:aggregated:1705320000000",
				metrics,
				300,
			);
			cache.operations = []; // Clear setup operations

			const result = await metricsCache.getCachedMetrics(timestamp);

			expect(result).toEqual(metrics);
			expect(cache.operations).toHaveLength(1);
			expect(cache.operations[0]).toMatchObject({
				op: "get",
				key: "talawa:v1:metrics:aggregated:1705320000000",
			});
		});

		it("should return null for cache miss", async () => {
			const result = await metricsCache.getCachedMetrics("1705320000000");

			expect(result).toBeNull();
		});

		it("should return null for empty timestamp", async () => {
			const result = await metricsCache.getCachedMetrics("");

			expect(result).toBeNull();
			expect(cache.operations).toHaveLength(0);
		});

		it("should handle cache get failures gracefully", async () => {
			const timestamp = "1705320000000";

			// Make cache.get throw an error
			const originalGet = cache.get.bind(cache);
			cache.get = vi.fn().mockRejectedValue(new Error("Cache error"));

			const result = await metricsCache.getCachedMetrics(timestamp);

			expect(result).toBeNull();
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "metrics cache: get failed",
					timestamp,
				}),
				"Failed to retrieve cached metrics",
			);
			cache.get = originalGet;
		});

		it("should log debug message on successful retrieval", async () => {
			const metrics = createSampleMetrics();
			const timestamp = "1705320000000";
			await cache.set(
				"talawa:v1:metrics:aggregated:1705320000000",
				metrics,
				300,
			);

			await metricsCache.getCachedMetrics(timestamp);

			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					key: "talawa:v1:metrics:aggregated:1705320000000",
					timestamp,
				}),
				"Metrics retrieved from cache",
			);
		});
	});

	describe("getCachedMetricsByWindow", () => {
		it("should retrieve hourly metrics", async () => {
			const metrics = createSampleMetrics();
			await cache.set(
				"talawa:v1:metrics:aggregated:hourly:2024-01-15-14",
				metrics,
				3600,
			);
			cache.operations = []; // Clear setup operations

			const result = await metricsCache.getCachedMetricsByWindow(
				"hourly",
				"2024-01-15-14",
			);

			expect(result).toEqual(metrics);
			expect(cache.operations[0]).toMatchObject({
				op: "get",
				key: "talawa:v1:metrics:aggregated:hourly:2024-01-15-14",
			});
		});

		it("should retrieve daily metrics", async () => {
			const metrics = createSampleMetrics();
			await cache.set(
				"talawa:v1:metrics:aggregated:daily:2024-01-15",
				metrics,
				86400,
			);
			cache.operations = []; // Clear setup operations

			const result = await metricsCache.getCachedMetricsByWindow(
				"daily",
				"2024-01-15",
			);

			expect(result).toEqual(metrics);
			expect(cache.operations[0]).toMatchObject({
				op: "get",
				key: "talawa:v1:metrics:aggregated:daily:2024-01-15",
			});
		});

		it("should return null for cache miss", async () => {
			const result = await metricsCache.getCachedMetricsByWindow(
				"hourly",
				"2024-01-15-14",
			);

			expect(result).toBeNull();
		});

		it("should return null for empty date", async () => {
			const result = await metricsCache.getCachedMetricsByWindow("hourly", "");

			expect(result).toBeNull();
			expect(cache.operations).toHaveLength(0);
		});

		it("should handle cache get failures gracefully", async () => {
			// Make cache.get throw an error
			const originalGet = cache.get.bind(cache);
			cache.get = vi.fn().mockRejectedValue(new Error("Cache error"));

			const result = await metricsCache.getCachedMetricsByWindow(
				"hourly",
				"2024-01-15-14",
			);

			expect(result).toBeNull();
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "metrics cache: get windowed failed",
					windowType: "hourly",
					date: "2024-01-15-14",
				}),
				"Failed to retrieve cached windowed metrics",
			);
			cache.get = originalGet;
		});

		it("should log debug message on successful retrieval", async () => {
			const metrics = createSampleMetrics();
			await cache.set(
				"talawa:v1:metrics:aggregated:hourly:2024-01-15-14",
				metrics,
				3600,
			);

			const result = await metricsCache.getCachedMetricsByWindow(
				"hourly",
				"2024-01-15-14",
			);

			expect(result).toEqual(metrics);
			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					key: "talawa:v1:metrics:aggregated:hourly:2024-01-15-14",
					windowType: "hourly",
					date: "2024-01-15-14",
				}),
				"Windowed metrics retrieved from cache",
			);
		});
	});

	describe("cacheWindowedMetrics", () => {
		it("should cache hourly metrics with default TTL", async () => {
			const metrics = createSampleMetrics();

			await metricsCache.cacheWindowedMetrics(
				metrics,
				"hourly",
				"2024-01-15-14",
			);

			expect(cache.operations[0]).toMatchObject({
				op: "set",
				key: "talawa:v1:metrics:aggregated:hourly:2024-01-15-14",
				ttl: 3600, // default hourly TTL
			});
		});

		it("should cache daily metrics with default TTL", async () => {
			const metrics = createSampleMetrics();

			await metricsCache.cacheWindowedMetrics(metrics, "daily", "2024-01-15");

			expect(cache.operations[0]).toMatchObject({
				op: "set",
				key: "talawa:v1:metrics:aggregated:daily:2024-01-15",
				ttl: 86400, // default daily TTL
			});
		});

		it("should use custom TTL when provided", async () => {
			const metrics = createSampleMetrics();

			await metricsCache.cacheWindowedMetrics(
				metrics,
				"hourly",
				"2024-01-15-14",
				7200,
			);

			expect(cache.operations[0]).toMatchObject({
				op: "set",
				ttl: 7200,
			});
		});

		it("should handle cache set failures gracefully", async () => {
			const metrics = createSampleMetrics();

			// Make cache.set throw an error
			const originalSet = cache.set.bind(cache);
			cache.set = vi.fn().mockRejectedValue(new Error("Cache error"));

			await metricsCache.cacheWindowedMetrics(
				metrics,
				"hourly",
				"2024-01-15-14",
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "metrics cache: set windowed failed",
					windowType: "hourly",
					date: "2024-01-15-14",
				}),
				"Failed to cache windowed metrics",
			);
			cache.set = originalSet;
		});

		it("should skip caching when metrics is null", async () => {
			await metricsCache.cacheWindowedMetrics(
				null as unknown as AggregatedMetrics,
				"hourly",
				"2024-01-15-14",
			);

			expect(cache.operations).toHaveLength(0);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "metrics cache: invalid windowed input",
					hasMetrics: false,
				}),
				"Skipping cache operation due to invalid input",
			);
		});

		it("should skip caching when date is empty", async () => {
			const metrics = createSampleMetrics();

			await metricsCache.cacheWindowedMetrics(metrics, "hourly", "");

			expect(cache.operations).toHaveLength(0);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "metrics cache: invalid windowed input",
					hasDate: false,
				}),
				"Skipping cache operation due to invalid input",
			);
		});

		it("should log debug message on successful caching", async () => {
			const metrics = createSampleMetrics();

			await metricsCache.cacheWindowedMetrics(
				metrics,
				"hourly",
				"2024-01-15-14",
			);

			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					key: "talawa:v1:metrics:aggregated:hourly:2024-01-15-14",
					windowType: "hourly",
					date: "2024-01-15-14",
				}),
				"Windowed metrics cached successfully",
			);
		});
	});

	describe("invalidateMetricsCache", () => {
		it("should invalidate all metrics when no pattern provided", async () => {
			// Set up some cache entries
			await cache.set("talawa:v1:metrics:aggregated:123", {}, 300);
			await cache.set(
				"talawa:v1:metrics:aggregated:hourly:2024-01-15",
				{},
				3600,
			);
			await cache.set("talawa:v1:other:key", {}, 300);

			await metricsCache.invalidateMetricsCache();

			// Should clear all metrics keys
			expect(await cache.get("talawa:v1:metrics:aggregated:123")).toBeNull();
			expect(
				await cache.get("talawa:v1:metrics:aggregated:hourly:2024-01-15"),
			).toBeNull();
			// Should not clear non-metrics keys
			expect(await cache.get("talawa:v1:other:key")).not.toBeNull();
		});

		it("should invalidate metrics matching pattern", async () => {
			// Set up some cache entries
			await cache.set(
				"talawa:v1:metrics:aggregated:hourly:2024-01-15",
				{},
				3600,
			);
			await cache.set(
				"talawa:v1:metrics:aggregated:daily:2024-01-15",
				{},
				86400,
			);
			await cache.set("talawa:v1:metrics:aggregated:123", {}, 300);

			await metricsCache.invalidateMetricsCache("aggregated:hourly:*");

			// Should clear only hourly metrics
			expect(
				await cache.get("talawa:v1:metrics:aggregated:hourly:2024-01-15"),
			).toBeNull();
			// Should not clear daily or timestamp-based metrics
			expect(
				await cache.get("talawa:v1:metrics:aggregated:daily:2024-01-15"),
			).not.toBeNull();
			expect(
				await cache.get("talawa:v1:metrics:aggregated:123"),
			).not.toBeNull();
		});

		it("should handle invalidation failures gracefully", async () => {
			// Make clearByPattern throw an error
			const originalClear = cache.clearByPattern.bind(cache);
			cache.clearByPattern = vi
				.fn()
				.mockRejectedValue(new Error("Clear error"));

			await metricsCache.invalidateMetricsCache();

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "metrics cache: invalidation failed",
				}),
				"Failed to invalidate metrics cache",
			);
			cache.clearByPattern = originalClear;
		});

		it("should log debug message on successful invalidation", async () => {
			await metricsCache.invalidateMetricsCache();

			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					pattern: "talawa:v1:metrics:*",
				}),
				"Metrics cache invalidated",
			);
		});
	});

	describe("constructor", () => {
		it("should use default TTL when not provided", async () => {
			const service = new MetricsCacheService(cache, mockLogger);
			const metrics = createSampleMetrics();

			// Perform an operation that uses the default TTL
			await service.cacheAggregatedMetrics(metrics, "1705320000000");

			// Verify the default TTL (300 seconds) is used
			expect(cache.operations[0]).toMatchObject({
				op: "set",
				ttl: 300,
			});
		});

		it("should use custom default TTL when provided", async () => {
			const service = new MetricsCacheService(cache, mockLogger, 600);
			const metrics = createSampleMetrics();

			await service.cacheAggregatedMetrics(metrics, "1705320000000");

			expect(cache.operations[0]).toMatchObject({
				op: "set",
				ttl: 600,
			});
		});

		it("should work without logger", async () => {
			const service = new MetricsCacheService(cache, undefined, 300);
			const metrics = createSampleMetrics();

			await service.cacheAggregatedMetrics(metrics, "1705320000000");

			// Should not throw and should cache successfully
			const result = await cache.get<AggregatedMetrics>(
				"talawa:v1:metrics:aggregated:1705320000000",
			);
			expect(result).toEqual(metrics);
		});
	});

	describe("edge cases", () => {
		it("should handle invalid timestamp format gracefully", async () => {
			const metrics = createSampleMetrics();
			// Invalid timestamp (non-numeric)
			const invalidTimestamp = "invalid-timestamp";

			await metricsCache.cacheAggregatedMetrics(metrics, invalidTimestamp);

			// Should still attempt to cache (validation happens at cache layer)
			expect(cache.operations.length).toBeGreaterThan(0);
		});

		it("should handle invalid date format in windowed metrics gracefully", async () => {
			const metrics = createSampleMetrics();
			// Invalid date format
			const invalidDate = "invalid-date-format";

			await metricsCache.cacheWindowedMetrics(metrics, "hourly", invalidDate);

			// Should still attempt to cache (validation happens at cache layer)
			expect(cache.operations.length).toBeGreaterThan(0);
		});

		it("should handle undefined cache service gracefully", async () => {
			// This test verifies the service can be constructed with undefined cache
			// In practice, this shouldn't happen due to dependency injection,
			// but we test the constructor accepts it and methods handle it gracefully
			const service = new MetricsCacheService(
				null as unknown as CacheService,
				mockLogger,
				300,
			);
			expect(service).toBeInstanceOf(MetricsCacheService);

			// Exercise behavior: call getCachedMetrics and verify it handles null cache gracefully
			const result = await service.getCachedMetrics("test");

			// Should return null (or handle gracefully) rather than throwing
			expect(result).toBeNull();
		});

		it("should handle very large metrics payloads", async () => {
			const largeMetrics: AggregatedMetrics = {
				...createSampleMetrics(),
				operations: Array.from({ length: 1000 }, (_, i) => ({
					operation: `op${i}`,
					count: 1,
					totalMs: 100,
					avgMs: 100,
					minMaxMs: 100,
					maxMaxMs: 100,
					medianMs: 100,
					p95Ms: 100,
					p99Ms: 100,
				})),
			};

			await metricsCache.cacheAggregatedMetrics(largeMetrics, "1705320000000");

			const result = await metricsCache.getCachedMetrics("1705320000000");
			expect(result?.operations).toHaveLength(1000);
		});

		it("should handle concurrent cache operations", async () => {
			const metrics1 = createSampleMetrics();
			const metrics2 = createSampleMetrics();

			await Promise.all([
				metricsCache.cacheAggregatedMetrics(metrics1, "1705320000000"),
				metricsCache.cacheAggregatedMetrics(metrics2, "1705320000001"),
			]);

			const [result1, result2] = await Promise.all([
				metricsCache.getCachedMetrics("1705320000000"),
				metricsCache.getCachedMetrics("1705320000001"),
			]);

			expect(result1).toEqual(metrics1);
			expect(result2).toEqual(metrics2);
		});
	});
});
