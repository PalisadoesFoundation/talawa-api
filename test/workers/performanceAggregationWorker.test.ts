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

		// Assert all expected operations are present
		const expectedOps = new Set([
			"db:users.byId",
			"db:organizations.byId",
			"db:events.byId",
		]);
		const actualOps = new Set(result.topSlowOps.map((op) => op.op));
		expect(actualOps).toEqual(expectedOps);

		// Assert length is correct
		expect(result.topSlowOps.length).toBe(3);
		expect(result.topSlowOps.length).toBeLessThanOrEqual(5);

		// Assert list is sorted by avgMs descending
		for (let i = 0; i < result.topSlowOps.length - 1; i++) {
			expect(result.topSlowOps[i]?.avgMs).toBeGreaterThanOrEqual(
				result.topSlowOps[i + 1]?.avgMs ?? 0,
			);
		}

		// Assert specific values
		expect(result.topSlowOps[0]?.op).toBe("db:users.byId");
		expect(result.topSlowOps[0]?.avgMs).toBe(275); // (250 + 300) / 2
		expect(result.topSlowOps[0]?.count).toBe(2);

		expect(result.topSlowOps[1]?.op).toBe("db:organizations.byId");
		expect(result.topSlowOps[1]?.avgMs).toBe(200);
		expect(result.topSlowOps[1]?.count).toBe(1);

		expect(result.topSlowOps[2]?.op).toBe("db:events.byId");
		expect(result.topSlowOps[2]?.avgMs).toBe(150);
		expect(result.topSlowOps[2]?.count).toBe(1);
	});

	it("should truncate to top 5 slow operations when more than 5 distinct ops exist", async () => {
		const snapshots: PerfSnapshot[] = [
			{
				totalMs: 100,
				totalOps: 1,
				cacheHits: 0,
				cacheMisses: 0,
				hitRate: 0,
				ops: {},
				slow: [
					{ op: "db:op1", ms: 600 }, // Highest avgMs
					{ op: "db:op2", ms: 500 },
					{ op: "db:op3", ms: 400 },
					{ op: "db:op4", ms: 300 },
					{ op: "db:op5", ms: 200 },
					{ op: "db:op6", ms: 100 }, // Should be excluded
					{ op: "db:op7", ms: 50 }, // Should be excluded
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
					{ op: "db:op1", ms: 700 }, // avgMs = (600 + 700) / 2 = 650
					{ op: "db:op2", ms: 550 }, // avgMs = (500 + 550) / 2 = 525
					{ op: "db:op3", ms: 450 }, // avgMs = (400 + 450) / 2 = 425
					{ op: "db:op4", ms: 350 }, // avgMs = (300 + 350) / 2 = 325
					{ op: "db:op5", ms: 250 }, // avgMs = (200 + 250) / 2 = 225
					{ op: "db:op6", ms: 150 }, // avgMs = (100 + 150) / 2 = 125 (excluded)
					{ op: "db:op7", ms: 75 }, // avgMs = (50 + 75) / 2 = 62.5 (excluded)
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

		// Assert truncation to top 5
		expect(result.topSlowOps.length).toBe(5);

		// Assert all expected top 5 operations are present
		const expectedTop5Ops = new Set([
			"db:op1",
			"db:op2",
			"db:op3",
			"db:op4",
			"db:op5",
		]);
		const actualOps = new Set(result.topSlowOps.map((op) => op.op));
		expect(actualOps).toEqual(expectedTop5Ops);

		// Assert excluded operations are not present
		expect(actualOps.has("db:op6")).toBe(false);
		expect(actualOps.has("db:op7")).toBe(false);

		// Assert list is sorted by avgMs descending
		for (let i = 0; i < result.topSlowOps.length - 1; i++) {
			expect(result.topSlowOps[i]?.avgMs).toBeGreaterThanOrEqual(
				result.topSlowOps[i + 1]?.avgMs ?? 0,
			);
		}

		// Assert correct order and values
		expect(result.topSlowOps[0]?.op).toBe("db:op1");
		expect(result.topSlowOps[0]?.avgMs).toBe(650); // (600 + 700) / 2
		expect(result.topSlowOps[0]?.count).toBe(2);

		expect(result.topSlowOps[1]?.op).toBe("db:op2");
		expect(result.topSlowOps[1]?.avgMs).toBe(525); // (500 + 550) / 2
		expect(result.topSlowOps[1]?.count).toBe(2);

		expect(result.topSlowOps[2]?.op).toBe("db:op3");
		expect(result.topSlowOps[2]?.avgMs).toBe(425); // (400 + 450) / 2
		expect(result.topSlowOps[2]?.count).toBe(2);

		expect(result.topSlowOps[3]?.op).toBe("db:op4");
		expect(result.topSlowOps[3]?.avgMs).toBe(325); // (300 + 350) / 2
		expect(result.topSlowOps[3]?.count).toBe(2);

		expect(result.topSlowOps[4]?.op).toBe("db:op5");
		expect(result.topSlowOps[4]?.avgMs).toBe(225); // (200 + 250) / 2
		expect(result.topSlowOps[4]?.count).toBe(2);
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
				periodStart: expect.any(Date),
				periodEnd: expect.any(Date),
				totalRequests: 1,
				avgRequestMs: expect.any(Number),
				avgDbMs: expect.any(Number),
				totalCacheHits: expect.any(Number),
				totalCacheMisses: expect.any(Number),
				avgHitRate: expect.any(Number),
				slowRequestCount: expect.any(Number),
				highComplexityCount: expect.any(Number),
				topSlowOps: expect.any(Array),
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

	describe("error handling and edge cases", () => {
		it("should handle snapshot with ops: null and return safe defaults", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 1,
					cacheMisses: 0,
					hitRate: 1,
					ops: null as unknown as PerfSnapshot["ops"],
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

			expect(result).toBeDefined();
			expect(result.avgDbMs).toBe(0);
			expect(result.totalRequests).toBe(1);
			expect(result.totalCacheHits).toBe(1);
			expect(result.totalCacheMisses).toBe(0);
			expect(result.highComplexityCount).toBe(0);
			expect(result.topSlowOps).toEqual([]);
		});

		it("should handle malformed slow entries and ignore invalid ones", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 0,
					cacheMisses: 0,
					hitRate: 0,
					ops: {},
					slow: [
						{ op: "db:users.byId", ms: 250 }, // Valid entry
						{ op: "db:organizations.byId", ms: "invalid" as unknown as number }, // Invalid: non-number ms
						{ op: "", ms: 200 }, // Invalid: empty op
						{ ms: 150 } as { op: string; ms: number }, // Invalid: missing op
						{ op: "db:events.byId", ms: Number.NaN }, // Invalid: NaN ms
						{ op: "db:posts.byId", ms: 300 }, // Valid entry
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

			expect(result.topSlowOps.length).toBe(2); // Only valid entries
			expect(result.topSlowOps[0]?.op).toBe("db:posts.byId");
			expect(result.topSlowOps[0]?.avgMs).toBe(300);
			expect(result.topSlowOps[1]?.op).toBe("db:users.byId");
			expect(result.topSlowOps[1]?.avgMs).toBe(250);
		});

		it("should handle extremely large numbers without overflow or NaN", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: Number.MAX_SAFE_INTEGER,
					totalOps: 1,
					cacheHits: Number.MAX_SAFE_INTEGER,
					cacheMisses: Number.MAX_SAFE_INTEGER,
					hitRate: 0.5,
					ops: {
						"db:users.byId": {
							count: 1,
							ms: Number.MAX_SAFE_INTEGER,
							max: Number.MAX_SAFE_INTEGER,
						},
					},
					slow: [{ op: "db:users.byId", ms: Number.MAX_SAFE_INTEGER }],
				},
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 1,
					cacheMisses: 1,
					hitRate: 0.5,
					ops: {
						"db:organizations.byId": { count: 1, ms: 50, max: 50 },
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

			expect(result).toBeDefined();
			expect(Number.isFinite(result.avgRequestMs)).toBe(true);
			expect(Number.isFinite(result.avgDbMs)).toBe(true);
			expect(Number.isFinite(result.avgHitRate)).toBe(true);
			expect(Number.isNaN(result.avgRequestMs)).toBe(false);
			expect(Number.isNaN(result.avgDbMs)).toBe(false);
			expect(Number.isNaN(result.avgHitRate)).toBe(false);
			expect(result.totalRequests).toBe(2);
			expect(result.totalCacheHits).toBeGreaterThan(0);
			expect(result.totalCacheMisses).toBeGreaterThan(0);
		});

		it("should catch and log internal errors without bubbling up", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 1,
					cacheMisses: 0,
					hitRate: 1,
					ops: {
						"db:users.byId": { count: 1, ms: 50, max: 50 },
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

			// Mock logger.info to throw an error
			mockLogger.info = vi.fn().mockImplementation(() => {
				throw new Error("Logger failure");
			});

			const result = await aggregatePerformanceMetrics(mockFastify, mockLogger);

			// Should still return valid metrics despite logger error
			expect(result).toBeDefined();
			expect(result.totalRequests).toBe(1);
			expect(result.avgRequestMs).toBe(100);
			expect(result.avgDbMs).toBe(50);

			// Should log the error
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Logger failure",
				}),
				"Failed to log aggregated metrics",
			);
		});

		it("should handle snapshot with undefined ops", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: 1,
					cacheMisses: 0,
					hitRate: 1,
					ops: undefined as unknown as PerfSnapshot["ops"],
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

			expect(result).toBeDefined();
			expect(result.avgDbMs).toBe(0);
			expect(result.highComplexityCount).toBe(0);
		});

		it("should handle snapshot with non-number totalMs", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: "invalid" as unknown as number,
					totalOps: 1,
					cacheHits: 1,
					cacheMisses: 0,
					hitRate: 1,
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

			expect(result).toBeDefined();
			expect(result.avgRequestMs).toBe(0);
			expect(result.slowRequestCount).toBe(0);
		});

		it("should handle snapshot with non-number cacheHits and cacheMisses", async () => {
			const snapshots: PerfSnapshot[] = [
				{
					totalMs: 100,
					totalOps: 1,
					cacheHits: "invalid" as unknown as number,
					cacheMisses: null as unknown as number,
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

			expect(result).toBeDefined();
			expect(result.totalCacheHits).toBe(0);
			expect(result.totalCacheMisses).toBe(0);
			expect(result.avgHitRate).toBe(0);
		});
	});
});
