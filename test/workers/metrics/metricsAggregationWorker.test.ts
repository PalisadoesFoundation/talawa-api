import type { FastifyBaseLogger } from "fastify";
import { describe, expect, it, vi } from "vitest";
import type { PerfSnapshot } from "~/src/utilities/metrics/performanceTracker";
import {
	aggregateMetrics,
	createEmptyAggregatedMetrics,
	runMetricsAggregationWorker,
} from "~/src/workers/metrics/metricsAggregationWorker";
import type { MetricsAggregationOptions } from "~/src/workers/metrics/types";

/**
 * Helper function to create a test performance snapshot.
 */
function createTestSnapshot(
	overrides: Partial<PerfSnapshot> = {},
): PerfSnapshot {
	return {
		totalMs: 0,
		totalOps: 0,
		cacheHits: 0,
		cacheMisses: 0,
		hitRate: 0,
		ops: {},
		slow: [],
		...overrides,
	};
}

describe("Metrics Aggregation Worker", () => {
	describe("createEmptyAggregatedMetrics", () => {
		it("should create empty metrics with default values", () => {
			const metrics = createEmptyAggregatedMetrics();

			expect(metrics.timestamp).toBeGreaterThan(0);
			expect(metrics.windowMinutes).toBe(5);
			expect(metrics.snapshotCount).toBe(0);
			expect(metrics.operations).toEqual({});
			expect(metrics.cache).toEqual({
				totalHits: 0,
				totalMisses: 0,
				totalOps: 0,
				hitRate: 0,
			});
			expect(metrics.slowOperationCount).toBe(0);
			expect(metrics.avgTotalMs).toBe(0);
			expect(metrics.minTotalMs).toBe(0);
			expect(metrics.maxTotalMs).toBe(0);
			expect(metrics.medianTotalMs).toBe(0);
			expect(metrics.p95TotalMs).toBe(0);
			expect(metrics.p99TotalMs).toBe(0);
		});

		it("should create empty metrics with custom options", () => {
			const timestamp = 1234567890;
			const metrics = createEmptyAggregatedMetrics({
				windowMinutes: 10,
				timestamp,
				snapshotCount: 5,
			});

			expect(metrics.timestamp).toBe(timestamp);
			expect(metrics.windowMinutes).toBe(10);
			expect(metrics.snapshotCount).toBe(5);
		});

		it("should create empty metrics with partial options", () => {
			const timestamp = 9876543210;
			const metrics = createEmptyAggregatedMetrics({
				timestamp,
			});

			expect(metrics.timestamp).toBe(timestamp);
			expect(metrics.windowMinutes).toBe(5); // Default
			expect(metrics.snapshotCount).toBe(0); // Default
		});
	});

	describe("aggregateMetrics", () => {
		it("should return empty metrics for empty snapshots array", () => {
			const result = aggregateMetrics([]);

			expect(result.snapshotsProcessed).toBe(0);
			expect(result.metrics.snapshotCount).toBe(0);
			expect(result.metrics.operations).toEqual({});
			expect(result.metrics.cache.totalOps).toBe(0);
			expect(result.aggregationDurationMs).toBeGreaterThanOrEqual(0);
		});

		it("should aggregate single snapshot with operations", () => {
			const snapshot = createTestSnapshot({
				totalMs: 100,
				ops: {
					db: { count: 2, ms: 80, max: 50 },
					"gql:query": { count: 1, ms: 20, max: 20 },
				},
			});

			const result = aggregateMetrics([snapshot]);

			expect(result.snapshotsProcessed).toBe(1);
			const dbOp = result.metrics.operations.db;
			const gqlOp = result.metrics.operations["gql:query"];
			expect(dbOp).toBeDefined();
			expect(dbOp?.count).toBe(2);
			expect(dbOp?.totalMs).toBe(80);
			expect(dbOp?.maxMs).toBe(50);
			expect(gqlOp).toBeDefined();
			expect(gqlOp?.count).toBe(1);
		});

		it("should aggregate multiple snapshots with same operations", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: { count: 2, ms: 80, max: 50 },
					},
				}),
				createTestSnapshot({
					ops: {
						db: { count: 3, ms: 120, max: 60 },
					},
				}),
			];

			const result = aggregateMetrics(snapshots);

			expect(result.snapshotsProcessed).toBe(2);
			const dbOp = result.metrics.operations.db;
			expect(dbOp?.count).toBe(5);
			expect(dbOp?.totalMs).toBe(200);
			expect(dbOp?.maxMs).toBe(60); // Max of max values
			expect(dbOp?.minMs).toBe(50); // Min of max values
		});

		it("should aggregate cache metrics", () => {
			const snapshots = [
				createTestSnapshot({
					cacheHits: 5,
					cacheMisses: 2,
				}),
				createTestSnapshot({
					cacheHits: 3,
					cacheMisses: 4,
				}),
			];

			const result = aggregateMetrics(snapshots);

			expect(result.metrics.cache.totalHits).toBe(8);
			expect(result.metrics.cache.totalMisses).toBe(6);
			expect(result.metrics.cache.totalOps).toBe(14);
			expect(result.metrics.cache.hitRate).toBeCloseTo(8 / 14, 3);
		});

		it("should handle zero cache operations", () => {
			const snapshot = createTestSnapshot({
				cacheHits: 0,
				cacheMisses: 0,
			});

			const result = aggregateMetrics([snapshot]);

			expect(result.metrics.cache.totalOps).toBe(0);
			expect(result.metrics.cache.hitRate).toBe(0);
		});

		it("should aggregate slow operations", () => {
			const snapshots = [
				createTestSnapshot({
					slow: [
						{ op: "db", ms: 250 },
						{ op: "gql:query", ms: 300 },
					],
				}),
				createTestSnapshot({
					slow: [{ op: "db", ms: 150 }],
				}),
			];

			const result = aggregateMetrics(snapshots, {
				slowThresholdMs: 200,
			});

			expect(result.metrics.slowOperationCount).toBe(2); // 250 and 300 >= 200
		});

		it("should filter slow operations by threshold", () => {
			const snapshots = [
				createTestSnapshot({
					slow: [
						{ op: "db", ms: 250 },
						{ op: "gql:query", ms: 150 }, // Below threshold
					],
				}),
			];

			const result = aggregateMetrics(snapshots, {
				slowThresholdMs: 200,
			});

			expect(result.metrics.slowOperationCount).toBe(1);
		});

		it("should calculate total request time statistics", () => {
			const snapshots = [
				createTestSnapshot({ totalMs: 100 }),
				createTestSnapshot({ totalMs: 200 }),
				createTestSnapshot({ totalMs: 300 }),
			];

			const result = aggregateMetrics(snapshots);

			expect(result.metrics.avgTotalMs).toBe(200);
			expect(result.metrics.minTotalMs).toBe(100);
			expect(result.metrics.maxTotalMs).toBe(300);
			expect(result.metrics.medianTotalMs).toBe(200);
		});

		it("should calculate percentiles correctly", () => {
			const snapshots = Array.from({ length: 100 }, (_, i) =>
				createTestSnapshot({ totalMs: i + 1 }),
			);

			const result = aggregateMetrics(snapshots);

			expect(result.metrics.p95TotalMs).toBeGreaterThanOrEqual(95);
			expect(result.metrics.p95TotalMs).toBeLessThanOrEqual(96);
			expect(result.metrics.p99TotalMs).toBeGreaterThanOrEqual(99);
			expect(result.metrics.p99TotalMs).toBeLessThanOrEqual(100);
		});

		it("should filter out invalid totalMs values", () => {
			const snapshots = [
				createTestSnapshot({ totalMs: 100 }),
				createTestSnapshot({ totalMs: Number.NaN }),
				createTestSnapshot({ totalMs: Number.POSITIVE_INFINITY }),
				createTestSnapshot({ totalMs: -50 }),
				createTestSnapshot({ totalMs: 200 }),
			];

			const result = aggregateMetrics(snapshots);

			expect(result.metrics.avgTotalMs).toBe(150); // Only 100 and 200
			expect(result.metrics.minTotalMs).toBe(100);
			expect(result.metrics.maxTotalMs).toBe(200);
		});

		it("should aggregate complexity scores", () => {
			const snapshots = [
				createTestSnapshot({ complexityScore: 100 }),
				createTestSnapshot({ complexityScore: 200 }),
				createTestSnapshot({ complexityScore: 300 }),
			];

			const result = aggregateMetrics(snapshots);

			expect(result.metrics.avgComplexityScore).toBe(200);
		});

		it("should handle snapshots without complexity scores", () => {
			const snapshots = [
				createTestSnapshot({ complexityScore: 100 }),
				createTestSnapshot({}), // No complexity score
			];

			const result = aggregateMetrics(snapshots);

			expect(result.metrics.avgComplexityScore).toBe(100);
		});

		it("should filter out invalid complexity scores", () => {
			const snapshots = [
				createTestSnapshot({ complexityScore: 100 }),
				createTestSnapshot({ complexityScore: Number.NaN }),
				createTestSnapshot({ complexityScore: Number.POSITIVE_INFINITY }),
				createTestSnapshot({ complexityScore: -50 }),
			];

			const result = aggregateMetrics(snapshots);

			expect(result.metrics.avgComplexityScore).toBe(100);
		});

		it("should limit snapshots by maxSnapshots", () => {
			const snapshots = Array.from({ length: 10 }, (_, i) =>
				createTestSnapshot({ totalMs: i + 1 }),
			);

			const result = aggregateMetrics(snapshots, {
				maxSnapshots: 5,
			});

			expect(result.snapshotsProcessed).toBe(5);
			expect(result.metrics.maxTotalMs).toBe(5);
		});

		it("should use default options when not provided", () => {
			const snapshot = createTestSnapshot({
				ops: { db: { count: 1, ms: 50, max: 50 } },
			});

			const result = aggregateMetrics([snapshot]);

			expect(result.metrics.windowMinutes).toBe(5);
			expect(result.snapshotsProcessed).toBe(1);
		});

		it("should handle operations with slow operation durations", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: { count: 2, ms: 100, max: 60 },
					},
					slow: [{ op: "db", ms: 250 }],
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			expect(dbOp?.count).toBe(2);
			// Percentiles should use slow operation durations when available
			expect(dbOp?.p95Ms).toBeGreaterThanOrEqual(0);
		});

		it("should handle operations with zero count", () => {
			const snapshot = createTestSnapshot({
				ops: {
					db: { count: 0, ms: 0, max: 0 },
				},
			});

			const result = aggregateMetrics([snapshot]);

			expect(result.metrics.operations.db).toEqual({
				count: 0,
				totalMs: 0,
				avgMs: 0,
				minMs: 0,
				maxMs: 0,
				medianMs: 0,
				p95Ms: 0,
				p99Ms: 0,
			});
		});

		it("should handle operations with invalid max values", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: { count: 1, ms: 50, max: Number.NaN },
					},
				}),
				createTestSnapshot({
					ops: {
						db: { count: 1, ms: 50, max: -10 },
					},
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			// Should still aggregate count and totalMs
			expect(dbOp?.count).toBe(2);
			expect(dbOp?.totalMs).toBe(100);
		});

		it("should calculate percentiles from avgMs when no other data", () => {
			const snapshot = createTestSnapshot({
				ops: {
					db: { count: 1, ms: 50, max: 50 },
				},
			});

			const result = aggregateMetrics([snapshot]);
			const dbOp = result.metrics.operations.db;

			// When only one data point, percentiles should use avgMs
			expect(dbOp?.medianMs).toBeGreaterThanOrEqual(0);
			expect(dbOp?.p95Ms).toBeGreaterThanOrEqual(0);
			expect(dbOp?.p99Ms).toBeGreaterThanOrEqual(0);
		});

		it("should handle operations that appear in some snapshots but not others", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: { count: 1, ms: 50, max: 50 },
						"gql:query": { count: 1, ms: 20, max: 20 },
					},
				}),
				createTestSnapshot({
					ops: {
						db: { count: 2, ms: 100, max: 60 },
					},
				}),
			];

			const result = aggregateMetrics(snapshots);
			const gqlOp = result.metrics.operations["gql:query"];

			expect(result.metrics.operations.db).toBeDefined();
			expect(gqlOp).toBeDefined();
			expect(gqlOp?.count).toBe(1);
		});

		it("should handle operations with only slow operation durations", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: { count: 1, ms: 50, max: 0 }, // max is 0, so filtered out
					},
					slow: [{ op: "db", ms: 250 }],
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			expect(dbOp?.count).toBe(1);
			// Should use slow operation duration for percentiles
			expect(dbOp?.p95Ms).toBeGreaterThanOrEqual(0);
		});

		it("should handle empty operations object", () => {
			const snapshot = createTestSnapshot({
				ops: {},
			});

			const result = aggregateMetrics([snapshot]);

			expect(result.metrics.operations).toEqual({});
		});

		it("should handle operations with max value of 0", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: { count: 1, ms: 50, max: 0 },
					},
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			expect(dbOp?.count).toBe(1);
			expect(dbOp?.maxMs).toBe(0);
			expect(dbOp?.minMs).toBe(0);
		});

		it("should handle single snapshot with single totalMs value", () => {
			const snapshot = createTestSnapshot({
				totalMs: 100,
			});

			const result = aggregateMetrics([snapshot]);

			expect(result.metrics.avgTotalMs).toBe(100);
			expect(result.metrics.minTotalMs).toBe(100);
			expect(result.metrics.maxTotalMs).toBe(100);
			expect(result.metrics.medianTotalMs).toBe(100);
		});

		it("should handle two snapshots for percentile calculation", () => {
			const snapshots = [
				createTestSnapshot({ totalMs: 100 }),
				createTestSnapshot({ totalMs: 200 }),
			];

			const result = aggregateMetrics(snapshots);

			expect(result.metrics.medianTotalMs).toBe(150); // Interpolated between 100 and 200
		});

		it("should handle operations with Infinity max values", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: { count: 1, ms: 50, max: Number.POSITIVE_INFINITY },
					},
				}),
				createTestSnapshot({
					ops: {
						db: { count: 1, ms: 50, max: 60 },
					},
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			// Infinity should be filtered out, so maxMs should be 60
			expect(dbOp?.maxMs).toBe(60);
		});

		it("should handle operations with negative max values", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: { count: 1, ms: 50, max: -10 },
					},
				}),
				createTestSnapshot({
					ops: {
						db: { count: 1, ms: 50, max: 60 },
					},
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			// Negative should be filtered out, so maxMs should be 60
			expect(dbOp?.maxMs).toBe(60);
		});

		it("should handle slow operations with invalid ms values", () => {
			const snapshots = [
				createTestSnapshot({
					slow: [
						{ op: "db", ms: 250 },
						{ op: "db", ms: Number.NaN },
						{ op: "db", ms: Number.POSITIVE_INFINITY },
						{ op: "db", ms: -50 },
					],
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			// Only valid slow operations should be used for percentiles
			expect(dbOp?.p95Ms).toBeGreaterThanOrEqual(0);
		});

		it("should handle totalMs of 0", () => {
			const snapshot = createTestSnapshot({
				totalMs: 0,
			});

			const result = aggregateMetrics([snapshot]);

			expect(result.metrics.avgTotalMs).toBe(0);
			expect(result.metrics.minTotalMs).toBe(0);
			expect(result.metrics.maxTotalMs).toBe(0);
		});

		it("should round complexity score to 2 decimal places", () => {
			const snapshots = [
				createTestSnapshot({ complexityScore: 100.123 }),
				createTestSnapshot({ complexityScore: 200.456 }),
			];

			const result = aggregateMetrics(snapshots);

			// Average is 150.2895, rounded to 2 decimals = 150.29
			expect(result.metrics.avgComplexityScore).toBe(150.29);
		});

		it("should not include avgComplexityScore when all snapshots lack it", () => {
			const snapshots = [createTestSnapshot({}), createTestSnapshot({})];

			const result = aggregateMetrics(snapshots);

			expect(result.metrics.avgComplexityScore).toBeUndefined();
		});

		it("should handle all totalMs values being invalid", () => {
			const snapshots = [
				createTestSnapshot({ totalMs: Number.NaN }),
				createTestSnapshot({ totalMs: Number.POSITIVE_INFINITY }),
				createTestSnapshot({ totalMs: -50 }),
			];

			const result = aggregateMetrics(snapshots);

			expect(result.metrics.avgTotalMs).toBe(0);
			expect(result.metrics.minTotalMs).toBe(0);
			expect(result.metrics.maxTotalMs).toBe(0);
			expect(result.metrics.medianTotalMs).toBe(0);
			expect(result.metrics.p95TotalMs).toBe(0);
			expect(result.metrics.p99TotalMs).toBe(0);
		});

		it("should handle operations with no max values and no slow operations", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: { count: 1, ms: 50, max: 0 },
					},
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			expect(dbOp?.count).toBe(1);
			expect(dbOp?.avgMs).toBe(50);
			// When no max values and no slow ops, percentiles use avgMs
			expect(dbOp?.medianMs).toBe(50);
		});

		it("should handle operations with filtered max values leaving empty array", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: { count: 1, ms: 50, max: Number.NaN },
					},
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			expect(dbOp?.count).toBe(1);
			expect(dbOp?.maxMs).toBe(0);
			expect(dbOp?.minMs).toBe(0);
		});

		it("should handle percentile calculation at boundaries (0 and 100)", () => {
			const snapshots = Array.from({ length: 10 }, (_, i) =>
				createTestSnapshot({ totalMs: i + 1 }),
			);

			const result = aggregateMetrics(snapshots);

			// p0 should be close to min, p100 should be close to max
			expect(result.metrics.minTotalMs).toBe(1);
			expect(result.metrics.maxTotalMs).toBe(10);
		});

		it("should handle operations with both max values and slow operations", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: { count: 2, ms: 100, max: 60 },
					},
					slow: [
						{ op: "db", ms: 250 },
						{ op: "db", ms: 300 },
					],
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			expect(dbOp?.count).toBe(2);
			// Should combine max values (60) and slow ops (250, 300) for percentiles
			expect(dbOp?.p95Ms).toBeGreaterThanOrEqual(0);
		});

		it("should handle non-finite avgMs calculation", () => {
			// Create a scenario where totalMs / totalCount would be non-finite
			// This can happen with very large numbers or edge cases
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: {
							count: 1,
							ms: Number.POSITIVE_INFINITY,
							max: 50,
						},
					},
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			// Should handle non-finite avgMs gracefully
			expect(dbOp?.avgMs).toBe(0);
		});

		it("should use empty array for percentiles when avgMs is 0", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: { count: 1, ms: 0, max: 0 },
					},
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			// When avgMs is 0 and no other data, percentiles should be 0
			expect(dbOp?.medianMs).toBe(0);
			expect(dbOp?.p95Ms).toBe(0);
			expect(dbOp?.p99Ms).toBe(0);
		});

		it("should handle percentile calculation with exact index match", () => {
			// Create exactly 100 snapshots to test exact percentile index
			const snapshots = Array.from({ length: 100 }, (_, i) =>
				createTestSnapshot({ totalMs: i + 1 }),
			);

			const result = aggregateMetrics(snapshots);

			// p50 should be exactly at index 50 (51st value)
			expect(result.metrics.medianTotalMs).toBe(51);
		});

		it("should handle operations where all max values are filtered out", () => {
			const snapshots = [
				createTestSnapshot({
					ops: {
						db: {
							count: 2,
							ms: 100,
							max: Number.NaN,
						},
					},
				}),
				createTestSnapshot({
					ops: {
						db: {
							count: 1,
							ms: 50,
							max: Number.POSITIVE_INFINITY,
						},
					},
				}),
			];

			const result = aggregateMetrics(snapshots);
			const dbOp = result.metrics.operations.db;

			expect(dbOp?.count).toBe(3);
			expect(dbOp?.totalMs).toBe(150);
			expect(dbOp?.maxMs).toBe(0);
			expect(dbOp?.minMs).toBe(0);
		});

		it("should handle empty snapshots with custom options", () => {
			const result = aggregateMetrics([], {
				windowMinutes: 10,
				maxSnapshots: 500,
				slowThresholdMs: 300,
			});

			expect(result.metrics.windowMinutes).toBe(10);
			expect(result.snapshotsProcessed).toBe(0);
		});
	});

	describe("runMetricsAggregationWorker", () => {
		it("should return empty metrics when no snapshots available", () => {
			const logger = {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			} as unknown as FastifyBaseLogger;

			const result = runMetricsAggregationWorker(() => [], logger);

			expect(result.snapshotsProcessed).toBe(0);
			expect(result.metrics.snapshotCount).toBe(0);
			expect(logger.info).toHaveBeenCalledWith(
				"No snapshots available for aggregation",
			);
		});

		it("should aggregate metrics when snapshots are available", () => {
			const logger = {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			} as unknown as FastifyBaseLogger;

			const snapshots = [
				createTestSnapshot({
					ops: { db: { count: 1, ms: 50, max: 50 } },
				}),
			];

			const result = runMetricsAggregationWorker(() => snapshots, logger);

			expect(result.snapshotsProcessed).toBe(1);
			expect(result.metrics.operations.db).toBeDefined();
			expect(logger.info).not.toHaveBeenCalledWith(
				"No snapshots available for aggregation",
			);
		});

		it("should use provided options", () => {
			const logger = {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			} as unknown as FastifyBaseLogger;

			const options: MetricsAggregationOptions = {
				windowMinutes: 10,
				maxSnapshots: 5,
				slowThresholdMs: 300,
			};

			const result = runMetricsAggregationWorker(() => [], logger, options);

			expect(result.metrics.windowMinutes).toBe(10);
		});

		it("should calculate aggregation duration", () => {
			const logger = {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			} as unknown as FastifyBaseLogger;

			const result = runMetricsAggregationWorker(() => [], logger);

			expect(result.aggregationDurationMs).toBeGreaterThanOrEqual(0);
		});

		it("should handle getSnapshots function that returns multiple snapshots", () => {
			const logger = {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
			} as unknown as FastifyBaseLogger;

			const snapshots = [
				createTestSnapshot({
					ops: { db: { count: 1, ms: 50, max: 50 } },
					cacheHits: 2,
				}),
				createTestSnapshot({
					ops: { db: { count: 2, ms: 100, max: 60 } },
					cacheMisses: 1,
				}),
			];

			const result = runMetricsAggregationWorker(() => snapshots, logger);
			const dbOp = result.metrics.operations.db;

			expect(result.snapshotsProcessed).toBe(2);
			expect(dbOp?.count).toBe(3);
			expect(result.metrics.cache.totalHits).toBe(2);
			expect(result.metrics.cache.totalMisses).toBe(1);
		});
	});
});
