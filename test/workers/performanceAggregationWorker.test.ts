import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PerfSnapshot } from "~/src/utilities/metrics/performanceTracker";
import { aggregatePerformanceMetrics } from "~/src/workers/performanceAggregationWorker";

describe("performanceAggregationWorker", () => {
	let mockFastify: FastifyInstance;
	let mockLogger: FastifyBaseLogger;

	beforeEach(() => {
		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as FastifyBaseLogger;

		mockFastify = {
			perfAggregate: {
				get totalRequests() {
					return 0;
				},
				get totalMs() {
					return 0;
				},
				get lastSnapshots() {
					return [];
				},
			},
			envConfig: {
				PERF_AGGREGATION_CRON_SCHEDULE: undefined,
			},
		} as unknown as FastifyInstance;
	});

	it("should handle empty snapshots", async () => {
		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		expect(result).toEqual({
			periodStart: expect.any(Date),
			periodEnd: expect.any(Date),
			totalRequests: 0,
			avgRequestMs: 0,
			avgDbMs: 0,
			totalCacheHits: 0,
			totalCacheMisses: 0,
			avgHitRate: 0,
			slowRequestCount: 0,
			highComplexityCount: 0,
			topSlowOps: [],
		});

		expect(mockLogger.info).toHaveBeenCalledWith(
			"No performance snapshots available for aggregation",
		);

		// Verify periodStart is calculated correctly (periodEnd - 5 minutes default)
		const timeDiff = result.periodEnd.getTime() - result.periodStart.getTime();
		expect(timeDiff).toBe(5 * 60 * 1000); // 5 minutes in milliseconds
	});

	it("should aggregate metrics from snapshots", async () => {
		const snapshots: PerfSnapshot[] = [
			{
				totalMs: 100,
				totalOps: 5,
				cacheHits: 2,
				cacheMisses: 1,
				hitRate: 0.67,
				ops: {
					"db:users.byId": { count: 2, ms: 50, max: 30 },
					"db:organizations.byId": { count: 1, ms: 20, max: 20 },
				},
				slow: [],
			},
			{
				totalMs: 200,
				totalOps: 3,
				cacheHits: 1,
				cacheMisses: 2,
				hitRate: 0.33,
				ops: {
					"db:users.byId": { count: 1, ms: 30, max: 30 },
				},
				slow: [{ op: "db:users.byId", ms: 300 }],
			},
		];

		mockFastify.perfAggregate = {
			get totalRequests() {
				return 0;
			},
			get totalMs() {
				return 0;
			},
			get lastSnapshots() {
				return snapshots;
			},
		} as typeof mockFastify.perfAggregate;

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		expect(result.totalRequests).toBe(2);
		expect(result.avgRequestMs).toBe(150); // (100 + 200) / 2
		expect(result.avgDbMs).toBe(50); // (50 + 20 + 30) / 2
		expect(result.totalCacheHits).toBe(3);
		expect(result.totalCacheMisses).toBe(3);
		expect(result.avgHitRate).toBe(0.5); // 3 hits / 6 total
		expect(result.slowRequestCount).toBe(0); // Neither snapshot >= 500ms (100 and 200)
		expect(result.highComplexityCount).toBe(0);
		expect(result.topSlowOps).toEqual([
			{ op: "db:users.byId", avgMs: 300, count: 1 },
		]);
	});

	it("should count high complexity queries", async () => {
		const snapshots: PerfSnapshot[] = [
			{
				totalMs: 50,
				totalOps: 2,
				cacheHits: 0,
				cacheMisses: 0,
				hitRate: 0,
				ops: {
					"gql:complexity": {
						count: 1,
						ms: 0.5,
						max: 0.5,
						score: 150,
					},
				},
				slow: [],
			},
			{
				totalMs: 60,
				totalOps: 2,
				cacheHits: 0,
				cacheMisses: 0,
				hitRate: 0,
				ops: {
					"gql:complexity": {
						count: 1,
						ms: 0.3,
						max: 0.3,
						score: 50,
					},
				},
				slow: [],
			},
		];

		mockFastify.perfAggregate = {
			get totalRequests() {
				return 0;
			},
			get totalMs() {
				return 0;
			},
			get lastSnapshots() {
				return snapshots;
			},
		} as typeof mockFastify.perfAggregate;

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		expect(result.highComplexityCount).toBe(1); // Only first snapshot has score >= 100
	});

	it("should handle slow requests correctly", async () => {
		const snapshots: PerfSnapshot[] = [
			{
				totalMs: 400,
				totalOps: 1,
				cacheHits: 0,
				cacheMisses: 0,
				hitRate: 0,
				ops: {},
				slow: [],
			},
			{
				totalMs: 500,
				totalOps: 1,
				cacheHits: 0,
				cacheMisses: 0,
				hitRate: 0,
				ops: {},
				slow: [],
			},
			{
				totalMs: 600,
				totalOps: 1,
				cacheHits: 0,
				cacheMisses: 0,
				hitRate: 0,
				ops: {},
				slow: [],
			},
		];

		mockFastify.perfAggregate = {
			get totalRequests() {
				return 0;
			},
			get totalMs() {
				return 0;
			},
			get lastSnapshots() {
				return snapshots;
			},
		} as typeof mockFastify.perfAggregate;

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		expect(result.slowRequestCount).toBe(2); // 500 and 600 are >= 500
	});

	it("should aggregate top slow operations", async () => {
		const snapshots: PerfSnapshot[] = [
			{
				totalMs: 100,
				totalOps: 1,
				cacheHits: 0,
				cacheMisses: 0,
				hitRate: 0,
				ops: {},
				slow: [
					{ op: "db:users.byId", ms: 250 },
					{ op: "db:organizations.byId", ms: 200 },
				],
			},
			{
				totalMs: 100,
				totalOps: 1,
				cacheHits: 0,
				cacheMisses: 0,
				hitRate: 0,
				ops: {},
				slow: [
					{ op: "db:users.byId", ms: 300 },
					{ op: "db:events.byId", ms: 150 },
				],
			},
		];

		mockFastify.perfAggregate = {
			get totalRequests() {
				return 0;
			},
			get totalMs() {
				return 0;
			},
			get lastSnapshots() {
				return snapshots;
			},
		} as typeof mockFastify.perfAggregate;

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		expect(result.topSlowOps.length).toBeLessThanOrEqual(5);
		expect(result.topSlowOps[0]?.op).toBe("db:users.byId");
		expect(result.topSlowOps[0]?.avgMs).toBe(275); // (250 + 300) / 2
		expect(result.topSlowOps[0]?.count).toBe(2);
	});

	it("should use custom cron schedule from envConfig", async () => {
		mockFastify.envConfig.PERF_AGGREGATION_CRON_SCHEDULE = "*/10 * * * *";

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		const timeDiff = result.periodEnd.getTime() - result.periodStart.getTime();
		expect(timeDiff).toBe(10 * 60 * 1000); // 10 minutes in milliseconds
	});

	it("should use process.env fallback for cron schedule", async () => {
		const originalEnv = process.env.PERF_AGGREGATION_CRON_SCHEDULE;
		process.env.PERF_AGGREGATION_CRON_SCHEDULE = "*/15 * * * *";
		mockFastify.envConfig.PERF_AGGREGATION_CRON_SCHEDULE = undefined;

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		const timeDiff = result.periodEnd.getTime() - result.periodStart.getTime();
		expect(timeDiff).toBe(15 * 60 * 1000); // 15 minutes in milliseconds

		process.env.PERF_AGGREGATION_CRON_SCHEDULE = originalEnv;
	});

	it("should handle hourly cron schedule", async () => {
		mockFastify.envConfig.PERF_AGGREGATION_CRON_SCHEDULE = "0 * * * *";

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		const timeDiff = result.periodEnd.getTime() - result.periodStart.getTime();
		expect(timeDiff).toBe(60 * 60 * 1000); // 1 hour in milliseconds
	});

	it("should handle daily cron schedule", async () => {
		mockFastify.envConfig.PERF_AGGREGATION_CRON_SCHEDULE = "0 0 * * *";

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		const timeDiff = result.periodEnd.getTime() - result.periodStart.getTime();
		expect(timeDiff).toBe(24 * 60 * 60 * 1000); // 24 hours in milliseconds
	});

	it("should handle unrecognized cron patterns with default", async () => {
		mockFastify.envConfig.PERF_AGGREGATION_CRON_SCHEDULE = "invalid pattern";

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		const timeDiff = result.periodEnd.getTime() - result.periodStart.getTime();
		expect(timeDiff).toBe(5 * 60 * 1000); // Default 5 minutes
	});

	it("should handle empty cron schedule string", async () => {
		mockFastify.envConfig.PERF_AGGREGATION_CRON_SCHEDULE = "";

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		const timeDiff = result.periodEnd.getTime() - result.periodStart.getTime();
		expect(timeDiff).toBe(5 * 60 * 1000); // Default 5 minutes
	});

	it("should handle cron schedule with less than 5 parts", async () => {
		mockFastify.envConfig.PERF_AGGREGATION_CRON_SCHEDULE = "* * *";

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		const timeDiff = result.periodEnd.getTime() - result.periodStart.getTime();
		expect(timeDiff).toBe(5 * 60 * 1000); // Default 5 minutes
	});

	it("should handle invalid */N pattern (NaN)", async () => {
		mockFastify.envConfig.PERF_AGGREGATION_CRON_SCHEDULE = "*/invalid * * * *";

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		const timeDiff = result.periodEnd.getTime() - result.periodStart.getTime();
		expect(timeDiff).toBe(5 * 60 * 1000); // Default 5 minutes
	});

	it("should handle */N pattern with zero interval", async () => {
		mockFastify.envConfig.PERF_AGGREGATION_CRON_SCHEDULE = "*/0 * * * *";

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		const timeDiff = result.periodEnd.getTime() - result.periodStart.getTime();
		expect(timeDiff).toBe(5 * 60 * 1000); // Default 5 minutes (zero is invalid)
	});

	it("should log aggregated metrics", async () => {
		const snapshots: PerfSnapshot[] = [
			{
				totalMs: 100,
				totalOps: 2,
				cacheHits: 1,
				cacheMisses: 1,
				hitRate: 0.5,
				ops: {},
				slow: [],
			},
		];

		mockFastify.perfAggregate = {
			get totalRequests() {
				return 0;
			},
			get totalMs() {
				return 0;
			},
			get lastSnapshots() {
				return snapshots;
			},
		} as typeof mockFastify.perfAggregate;

		await aggregatePerformanceMetrics(mockFastify, mockLogger);

		expect(mockLogger.info).toHaveBeenCalledWith(
			expect.objectContaining({
				msg: "Performance metrics aggregation",
				totalRequests: 1,
				avgRequestMs: expect.any(Number),
			}),
			"Performance metrics aggregated",
		);
	});

	it("should handle snapshots with no database operations", async () => {
		const snapshots: PerfSnapshot[] = [
			{
				totalMs: 50,
				totalOps: 1,
				cacheHits: 0,
				cacheMisses: 0,
				hitRate: 0,
				ops: {
					"gql:parse": { count: 1, ms: 10, max: 10 },
				},
				slow: [],
			},
		];

		mockFastify.perfAggregate = {
			get totalRequests() {
				return 0;
			},
			get totalMs() {
				return 0;
			},
			get lastSnapshots() {
				return snapshots;
			},
		} as typeof mockFastify.perfAggregate;

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		expect(result.avgDbMs).toBe(0);
	});

	it("should handle complexity op without score", async () => {
		const snapshots: PerfSnapshot[] = [
			{
				totalMs: 50,
				totalOps: 1,
				cacheHits: 0,
				cacheMisses: 0,
				hitRate: 0,
				ops: {
					"gql:complexity": {
						count: 1,
						ms: 0.5,
						max: 0.5,
						// score is undefined
					},
				},
				slow: [],
			},
		];

		mockFastify.perfAggregate = {
			get totalRequests() {
				return 0;
			},
			get totalMs() {
				return 0;
			},
			get lastSnapshots() {
				return snapshots;
			},
		} as typeof mockFastify.perfAggregate;

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		expect(result.highComplexityCount).toBe(0);
	});

	it("should handle complexity op with score below threshold", async () => {
		const snapshots: PerfSnapshot[] = [
			{
				totalMs: 50,
				totalOps: 1,
				cacheHits: 0,
				cacheMisses: 0,
				hitRate: 0,
				ops: {
					"gql:complexity": {
						count: 1,
						ms: 0.5,
						max: 0.5,
						score: 99,
					},
				},
				slow: [],
			},
		];

		mockFastify.perfAggregate = {
			get totalRequests() {
				return 0;
			},
			get totalMs() {
				return 0;
			},
			get lastSnapshots() {
				return snapshots;
			},
		} as typeof mockFastify.perfAggregate;

		const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

		expect(result.highComplexityCount).toBe(0);
	});
});
