import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PerfSnapshot } from "~/src/utilities/metrics/performanceTracker";
import {
	calculatePercentile,
	runMetricsAggregationWorker,
} from "~/src/workers/metrics/metricsAggregationWorker";

describe("calculatePercentile", () => {
	it("returns 0 for empty array", () => {
		const result = calculatePercentile([], 50);
		expect(result).toBe(0);
	});

	it("returns the single value for single-element array", () => {
		const result = calculatePercentile([42], 50);
		expect(result).toBe(42);
	});

	it("calculates percentile correctly for multiple values", () => {
		const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		// Median (50th percentile) of [1,2,3,4,5,6,7,8,9,10] with linear interpolation
		// index = 0.5 * 9 = 4.5, interpolate between values[4]=5 and values[5]=6
		// result = 5 + 0.5 * (6 - 5) = 5.5
		const median = calculatePercentile(values, 50);
		expect(median).toBeCloseTo(5.5, 1);
	});
});

describe("metricsAggregationWorker", () => {
	let mockLogger: FastifyBaseLogger;
	let snapshotGetter: (windowMinutes?: number) => PerfSnapshot[];

	beforeEach(() => {
		vi.clearAllMocks();

		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as FastifyBaseLogger;

		snapshotGetter = vi.fn(() => []);
	});

	describe("runMetricsAggregationWorker", () => {
		it("returns undefined when no snapshots are available", async () => {
			snapshotGetter = vi.fn(() => []);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeUndefined();
			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					windowMinutes: 5,
				}),
				"No snapshots available for metrics aggregation",
			);
		});

		it("aggregates metrics from single snapshot", async () => {
			const snapshot: PerfSnapshot = {
				totalMs: 100,
				totalOps: 2,
				cacheHits: 1,
				cacheMisses: 1,
				hitRate: 0.5,
				ops: {
					db: {
						count: 1,
						ms: 50,
						max: 50,
					},
					cache: {
						count: 2,
						ms: 30,
						max: 20,
					},
				},
				slow: [],
			};

			snapshotGetter = vi.fn(() => [snapshot]);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.snapshotCount).toBe(1);
			expect(result?.windowMinutes).toBe(5);
			expect(result?.requests.count).toBe(1);
			expect(result?.requests.avgTotalMs).toBe(100);
			expect(result?.requests.minTotalMs).toBe(100);
			expect(result?.requests.maxTotalMs).toBe(100);
			expect(result?.cache.totalHits).toBe(1);
			expect(result?.cache.totalMisses).toBe(1);
			expect(result?.cache.hitRate).toBe(0.5);
			expect(result?.operations).toHaveLength(2);
		});

		it("aggregates metrics from multiple snapshots", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 2,
					cacheMisses: 0,
					hitRate: 1.0,
					ops: {
						db: {
							count: 1,
							ms: 100,
							max: 100,
						},
					},
					slow: [],
				},
				{
					totalMs: 200,
					totalOps: 2,
					cacheHits: 0,
					cacheMisses: 2,
					hitRate: 0.0,
					ops: {
						db: {
							count: 2,
							ms: 200,
							max: 150,
						},
					},
					slow: [],
				},
				{
					totalMs: 150,
					totalOps: 1,
					cacheHits: 1,
					cacheMisses: 1,
					hitRate: 0.5,
					ops: {
						db: {
							count: 1,
							ms: 150,
							max: 150,
						},
					},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.snapshotCount).toBe(3);
			expect(result?.requests.count).toBe(3);
			expect(result?.requests.avgTotalMs).toBe(150); // (100 + 200 + 150) / 3
			expect(result?.requests.minTotalMs).toBe(100);
			expect(result?.requests.maxTotalMs).toBe(200);
			expect(result?.cache.totalHits).toBe(3); // 2 + 0 + 1
			expect(result?.cache.totalMisses).toBe(3); // 0 + 2 + 1
			expect(result?.cache.hitRate).toBe(0.5); // 3 / 6
		});

		it("calculates percentiles correctly", async () => {
			// Create snapshots with varying response times for percentile calculation
			const snapshots: PerfSnapshot[] = Array.from({ length: 100 }, (_, i) => ({
				totalMs: i + 1, // 1 to 100
				totalOps: 1,
				cacheHits: 0,
				cacheMisses: 0,
				hitRate: 0,
				ops: {},
				slow: [],
			}));

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			// With linear interpolation for 100 values (1-100):
			// p50 = (50/100) * 99 = 49.5, interpolate between index 49 (50) and 50 (51) = 50.5, rounds to 51
			// p95 = (95/100) * 99 = 94.05, interpolate between index 94 (95) and 95 (96) = 95.05, rounds to 95
			// p99 = (99/100) * 99 = 98.01, interpolate between index 98 (99) and 99 (100) = 99.01, rounds to 99
			expect(result?.requests.medianTotalMs).toBe(51);
			expect(result?.requests.p95TotalMs).toBe(95);
			expect(result?.requests.p99TotalMs).toBe(99);
		});

		it("aggregates operation metrics correctly", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 2,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {
						db: {
							count: 2,
							ms: 80,
							max: 50,
						},
						http: {
							count: 1,
							ms: 20,
							max: 20,
						},
					},
					slow: [],
				},
				{
					totalMs: 150,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {
						db: {
							count: 1,
							ms: 150,
							max: 150,
						},
					},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.operations).toHaveLength(2);

			const dbOp = result?.operations.find((op) => op.operation === "db");
			expect(dbOp).toBeDefined();
			expect(dbOp?.count).toBe(3); // 2 + 1
			expect(dbOp?.totalMs).toBe(230); // 80 + 150

			const httpOp = result?.operations.find((op) => op.operation === "http");
			expect(httpOp).toBeDefined();
			expect(httpOp?.count).toBe(1);
		});

		it("aggregates slow operations correctly", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [
						{ op: "db", ms: 300 },
						{ op: "db", ms: 250 },
					],
				},
				{
					totalMs: 200,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [
						{ op: "http", ms: 400 },
						{ op: "db", ms: 350 },
					],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.slowOperations.count).toBe(4); // 2 + 2
			expect(result?.slowOperations.byOperation.db).toBe(3); // 2 + 1
			expect(result?.slowOperations.byOperation.http).toBe(1);
		});

		it("handles snapshots with complexity scores", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [],
					complexityScore: 10,
				},
				{
					totalMs: 200,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [],
					complexityScore: 20,
				},
				{
					totalMs: 150,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [],
					// No complexity score
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.complexity).toBeDefined();
			expect(result?.complexity?.count).toBe(2);
			expect(result?.complexity?.avgScore).toBe(15); // (10 + 20) / 2
			expect(result?.complexity?.minScore).toBe(10);
			expect(result?.complexity?.maxScore).toBe(20);
		});

		it("returns undefined complexity when no snapshots have complexity scores", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.complexity).toBeUndefined();
		});

		it("sorts operations by total time descending", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 2,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {
						fast: {
							count: 1,
							ms: 10,
							max: 10,
						},
						slow: {
							count: 1,
							ms: 90,
							max: 90,
						},
					},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.operations).toHaveLength(2);
			expect(result?.operations[0]?.operation).toBe("slow");
			expect(result?.operations[1]?.operation).toBe("fast");
		});

		it("filters out operations with zero count", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {
						active: {
							count: 1,
							ms: 100,
							max: 100,
						},
					},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.operations).toHaveLength(1);
			expect(result?.operations[0]?.operation).toBe("active");
		});

		it("handles empty operations correctly", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 50,
					totalOps: 0,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.operations).toHaveLength(0);
		});

		it("logs aggregation results", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 1,
					cacheMisses: 1,
					hitRate: 0.5,
					ops: {
						db: {
							count: 1,
							ms: 100,
							max: 100,
						},
					},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			await runMetricsAggregationWorker(snapshotGetter, 5, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					windowMinutes: 5,
					snapshotCount: 1,
					requestCount: 1,
					operationCount: 1,
					slowOperationCount: 0,
					cacheHitRate: expect.stringMatching(/^\d+\.\d+%$/),
				}),
				"Metrics aggregation completed successfully",
			);
		});

		it("handles errors and logs them", async () => {
			const error = new Error("Snapshot getter failed");
			snapshotGetter = vi.fn(() => {
				throw error;
			});

			await expect(
				runMetricsAggregationWorker(snapshotGetter, 5, mockLogger),
			).rejects.toThrow("Snapshot getter failed");

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					windowMinutes: 5,
					error: "Snapshot getter failed",
					stack: expect.any(String),
				}),
				"Metrics aggregation worker failed",
			);
		});

		it("handles non-Error exceptions", async () => {
			snapshotGetter = vi.fn(() => {
				throw "String error";
			});

			await expect(
				runMetricsAggregationWorker(snapshotGetter, 5, mockLogger),
			).rejects.toBe("String error");

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Unknown error",
				}),
				"Metrics aggregation worker failed",
			);
		});

		it("calls snapshot getter with correct window minutes", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			await runMetricsAggregationWorker(snapshotGetter, 10, mockLogger);

			expect(snapshotGetter).toHaveBeenCalledWith(10);
		});

		it("handles cache metrics with zero operations", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 0,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.cache.totalOps).toBe(0);
			expect(result?.cache.hitRate).toBe(0);
		});

		it("handles operation with zero count (should not be included)", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {
						validOp: {
							count: 1,
							ms: 100,
							max: 100,
						},
						zeroCountOp: {
							count: 0,
							ms: 0,
							max: 0,
						},
					},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			// zeroCountOp should be filtered out because count is 0
			expect(result?.operations).toHaveLength(1);
			expect(result?.operations[0]?.operation).toBe("validOp");
		});

		it("handles operation metrics when avgDurations is empty (returns 0 for percentiles)", async () => {
			// This case shouldn't happen in practice, but we test the branch
			// When opStats exists but count is 0, avgDurations stays empty
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 0,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {
						emptyOp: {
							count: 0,
							ms: 0,
							max: 0,
						},
					},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			// emptyOp should be filtered out
			expect(result?.operations).toHaveLength(0);
		});

		it("handles single complexity score", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [],
					complexityScore: 15,
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.complexity).toBeDefined();
			expect(result?.complexity?.count).toBe(1);
			expect(result?.complexity?.avgScore).toBe(15);
			expect(result?.complexity?.minScore).toBe(15);
			expect(result?.complexity?.maxScore).toBe(15);
		});

		it("handles calculatePercentile edge case when lower equals upper (exact index)", async () => {
			// Test with exactly 2 snapshots to trigger the case where index calculation
			// might result in lower === upper for certain percentiles
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 50,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [],
				},
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			// With 2 values [50, 100], median is exactly (50 + 100) / 2 = 75
			expect(result?.requests.medianTotalMs).toBe(75);
		});

		it("handles cache with all hits", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 5,
					cacheMisses: 0,
					hitRate: 1.0,
					ops: {},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.cache.totalHits).toBe(5);
			expect(result?.cache.totalMisses).toBe(0);
			expect(result?.cache.hitRate).toBe(1.0);
		});

		it("handles cache with all misses", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 5,
					hitRate: 0.0,
					ops: {},
					slow: [],
				},
			];

			snapshotGetter = vi.fn(() => snapshots);

			const result = await runMetricsAggregationWorker(
				snapshotGetter,
				5,
				mockLogger,
			);

			expect(result).toBeDefined();
			expect(result?.cache.totalHits).toBe(0);
			expect(result?.cache.totalMisses).toBe(5);
			expect(result?.cache.hitRate).toBe(0.0);
		});
	});
});
