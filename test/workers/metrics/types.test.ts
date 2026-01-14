import { describe, expect, it } from "vitest";
import type {
	AggregatedMetrics,
	CacheMetrics,
	OperationMetrics,
	TimeSeriesMetrics,
} from "~/src/workers/metrics/types";

describe("Metrics Types", () => {
	describe("Type exports", () => {
		it("should export AggregatedMetrics type", () => {
			const metrics: AggregatedMetrics = {
				timestamp: Date.now(),
				windowMinutes: 5,
				snapshotCount: 10,
				requests: {
					count: 10,
					avgTotalMs: 100,
					minTotalMs: 50,
					maxTotalMs: 200,
					medianTotalMs: 100,
					p95TotalMs: 190,
					p99TotalMs: 195,
				},
				cache: {
					totalHits: 5,
					totalMisses: 5,
					hitRate: 0.5,
					totalOps: 10,
				},
				operations: [],
				slowOperations: {
					count: 0,
					byOperation: {},
				},
			};

			expect(metrics).toBeDefined();
			expect(metrics.timestamp).toBeTypeOf("number");
			expect(metrics.windowMinutes).toBe(5);
			expect(metrics.snapshotCount).toBe(10);
		});

		it("should export CacheMetrics type", () => {
			const cache: CacheMetrics = {
				totalHits: 10,
				totalMisses: 5,
				hitRate: 0.6666666666666666,
				totalOps: 15,
			};

			expect(cache).toBeDefined();
			expect(cache.totalHits).toBe(10);
			expect(cache.totalMisses).toBe(5);
			expect(cache.hitRate).toBeCloseTo(0.67, 2);
			expect(cache.totalOps).toBe(15);
		});

		it("should export OperationMetrics type", () => {
			const operation: OperationMetrics = {
				operation: "db",
				count: 5,
				totalMs: 500,
				avgMs: 100,
				minMaxMs: 50,
				maxMaxMs: 200,
				medianMs: 100,
				p95Ms: 190,
				p99Ms: 195,
			};

			expect(operation).toBeDefined();
			expect(operation.operation).toBe("db");
			expect(operation.count).toBe(5);
			expect(operation.totalMs).toBe(500);
			expect(operation.avgMs).toBe(100);
		});

		it("should export TimeSeriesMetrics type", () => {
			const timeSeries: TimeSeriesMetrics = {
				timestamp: Date.now(),
				windowMinutes: 5,
				snapshotCount: 10,
			};

			expect(timeSeries).toBeDefined();
			expect(timeSeries.timestamp).toBeTypeOf("number");
			expect(timeSeries.windowMinutes).toBe(5);
			expect(timeSeries.snapshotCount).toBe(10);
		});
	});

	describe("Interface contracts", () => {
		it("should allow AggregatedMetrics to extend TimeSeriesMetrics", () => {
			const metrics: AggregatedMetrics = {
				timestamp: Date.now(),
				windowMinutes: 5,
				snapshotCount: 10,
				requests: {
					count: 10,
					avgTotalMs: 100,
					minTotalMs: 50,
					maxTotalMs: 200,
					medianTotalMs: 100,
					p95TotalMs: 190,
					p99TotalMs: 195,
				},
				cache: {
					totalHits: 5,
					totalMisses: 5,
					hitRate: 0.5,
					totalOps: 10,
				},
				operations: [],
				slowOperations: {
					count: 0,
					byOperation: {},
				},
			};

			// Verify it has TimeSeriesMetrics properties
			expect(metrics.timestamp).toBeDefined();
			expect(metrics.windowMinutes).toBeDefined();
			expect(metrics.snapshotCount).toBeDefined();
		});

		it("should allow optional complexity in AggregatedMetrics", () => {
			const metricsWithoutComplexity: AggregatedMetrics = {
				timestamp: Date.now(),
				windowMinutes: 5,
				snapshotCount: 10,
				requests: {
					count: 10,
					avgTotalMs: 100,
					minTotalMs: 50,
					maxTotalMs: 200,
					medianTotalMs: 100,
					p95TotalMs: 190,
					p99TotalMs: 195,
				},
				cache: {
					totalHits: 5,
					totalMisses: 5,
					hitRate: 0.5,
					totalOps: 10,
				},
				operations: [],
				slowOperations: {
					count: 0,
					byOperation: {},
				},
			};

			expect(metricsWithoutComplexity.complexity).toBeUndefined();

			const metricsWithComplexity: AggregatedMetrics = {
				...metricsWithoutComplexity,
				complexity: {
					avgScore: 15,
					minScore: 10,
					maxScore: 20,
					count: 2,
				},
			};

			expect(metricsWithComplexity.complexity).toBeDefined();
			expect(metricsWithComplexity.complexity?.avgScore).toBe(15);
		});

		/**
		 * Note: This test serves as documentation and a regression guard for the CacheMetrics interface contract.
		 * TypeScript enforces required properties at compile time, so this test doesn't provide runtime validation.
		 * It documents the expected structure and helps catch accidental interface changes during refactoring.
		 */
		it("should enforce required properties in CacheMetrics", () => {
			const cache: CacheMetrics = {
				totalHits: 0,
				totalMisses: 0,
				hitRate: 0,
				totalOps: 0,
			};

			expect(cache.totalHits).toBeDefined();
			expect(cache.totalMisses).toBeDefined();
			expect(cache.hitRate).toBeDefined();
			expect(cache.totalOps).toBeDefined();
		});

		/**
		 * Note: This test serves as documentation and a regression guard for the OperationMetrics interface contract.
		 * TypeScript enforces required properties at compile time, so this test doesn't provide runtime validation.
		 * It documents the expected structure and helps catch accidental interface changes during refactoring.
		 */
		it("should enforce required properties in OperationMetrics", () => {
			const operation: OperationMetrics = {
				operation: "test",
				count: 0,
				totalMs: 0,
				avgMs: 0,
				minMaxMs: 0,
				maxMaxMs: 0,
				medianMs: 0,
				p95Ms: 0,
				p99Ms: 0,
			};

			expect(operation.operation).toBeDefined();
			expect(operation.count).toBeDefined();
			expect(operation.totalMs).toBeDefined();
			expect(operation.avgMs).toBeDefined();
			expect(operation.minMaxMs).toBeDefined();
			expect(operation.maxMaxMs).toBeDefined();
			expect(operation.medianMs).toBeDefined();
			expect(operation.p95Ms).toBeDefined();
			expect(operation.p99Ms).toBeDefined();
		});
	});
});
