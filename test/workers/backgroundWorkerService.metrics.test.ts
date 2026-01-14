import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import type { ScheduledTask, ScheduleOptions } from "node-cron";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";
import type { PerfSnapshot } from "~/src/utilities/metrics/performanceTracker";

import {
	getBackgroundWorkerStatus,
	runMetricsAggregationWorkerSafely,
	startBackgroundWorkers,
	stopBackgroundWorkers,
} from "~/src/workers/backgroundWorkerService";

vi.mock("node-cron", () => {
	let callCount = 0;

	const schedule = vi.fn(
		(
			_expr: string,
			funcOrString: string | ((now: Date | "manual" | "init") => void),
			_options?: ScheduleOptions,
		): ScheduledTask => {
			const thisCall = callCount;
			callCount++;

			const start = vi.fn(() => {
				if (thisCall === 0 && typeof funcOrString === "function") {
					funcOrString("manual");
				}
			});

			const stop = vi.fn();

			return { start, stop } as unknown as ScheduledTask;
		},
	);

	const __resetMock = () => {
		callCount = 0;
		schedule.mockClear();
	};

	return {
		default: { schedule },
		__resetMock,
	};
});

// Mock event materialization pipeline
vi.mock("~/src/workers/eventGeneration/eventGenerationPipeline", () => ({
	createDefaultWorkerConfig: vi.fn(() => ({ config: true })),
	runMaterializationWorker: vi.fn(),
}));

// Mock cleanup worker
vi.mock("~/src/workers/eventCleanupWorker", () => ({
	cleanupOldInstances: vi.fn(),
}));

// Mock metrics aggregation worker
vi.mock("~/src/workers/metrics/metricsAggregationWorker", () => ({
	runMetricsAggregationWorker: vi.fn(),
}));

describe("backgroundWorkerService - metrics integration", () => {
	let mockDrizzleClient: NodePgDatabase<typeof schema>;
	let mockLogger: FastifyBaseLogger;
	let mockGetMetricsSnapshots: (windowMinutes?: number) => PerfSnapshot[];

	beforeEach(async () => {
		vi.clearAllMocks();
		delete process.env.API_METRICS_AGGREGATION_ENABLED;
		delete process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE;
		delete process.env.API_METRICS_AGGREGATION_WINDOW_MINUTES;

		const cron = await import("node-cron");
		(cron as { __resetMock?: () => void }).__resetMock?.();

		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as FastifyBaseLogger;

		mockDrizzleClient = {} as unknown as NodePgDatabase<typeof schema>;

		mockGetMetricsSnapshots = vi.fn(() => []);
	});

	describe("startBackgroundWorkers with metrics", () => {
		it("starts metrics worker when snapshot getter is provided and enabled", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});

			await startBackgroundWorkers(
				mockDrizzleClient,
				mockLogger,
				mockGetMetricsSnapshots,
			);

			const cron = await import("node-cron");
			// Should schedule 3 workers: materialization, cleanup, and metrics
			expect(vi.mocked(cron.default.schedule)).toHaveBeenCalledTimes(3);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					metricsSchedule: expect.any(String),
					metricsWindowMinutes: expect.any(Number),
				}),
				"Metrics aggregation worker scheduled",
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					materializationSchedule: expect.any(String),
					cleanupSchedule: expect.any(String),
					metricsEnabled: true,
				}),
				"Background worker service started successfully",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("does not start metrics worker when snapshot getter is not provided", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});

			await startBackgroundWorkers(mockDrizzleClient, mockLogger);

			const cron = await import("node-cron");
			// Should schedule only 2 workers: materialization and cleanup
			expect(vi.mocked(cron.default.schedule)).toHaveBeenCalledTimes(2);

			expect(mockLogger.info).not.toHaveBeenCalledWith(
				expect.objectContaining({
					metricsSchedule: expect.any(String),
				}),
				"Metrics aggregation worker scheduled",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("does not start metrics worker when disabled via env var", async () => {
			process.env.API_METRICS_AGGREGATION_ENABLED = "false";

			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});

			await startBackgroundWorkers(
				mockDrizzleClient,
				mockLogger,
				mockGetMetricsSnapshots,
			);

			const cron = await import("node-cron");
			// Should schedule only 2 workers: materialization and cleanup
			expect(vi.mocked(cron.default.schedule)).toHaveBeenCalledTimes(2);

			expect(mockLogger.info).not.toHaveBeenCalledWith(
				expect.objectContaining({
					metricsSchedule: expect.any(String),
				}),
				"Metrics aggregation worker scheduled",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("warns when metrics enabled but snapshot getter not available", async () => {
			process.env.API_METRICS_AGGREGATION_ENABLED = "true";

			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});

			await startBackgroundWorkers(mockDrizzleClient, mockLogger);

			expect(mockLogger.warn).toHaveBeenCalledWith(
				"Metrics aggregation is enabled but snapshot getter is not available. Metrics worker will not start.",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("uses custom cron schedule from env var", async () => {
			process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE = "*/10 * * * *";

			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});

			await startBackgroundWorkers(
				mockDrizzleClient,
				mockLogger,
				mockGetMetricsSnapshots,
			);

			const cron = await import("node-cron");
			expect(vi.mocked(cron.default.schedule)).toHaveBeenCalledWith(
				"*/10 * * * *",
				expect.any(Function),
				expect.objectContaining({ scheduled: false, timezone: "UTC" }),
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					metricsSchedule: "*/10 * * * *",
				}),
				"Metrics aggregation worker scheduled",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("uses custom window minutes from env var", async () => {
			process.env.API_METRICS_AGGREGATION_WINDOW_MINUTES = "10";

			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});

			await startBackgroundWorkers(
				mockDrizzleClient,
				mockLogger,
				mockGetMetricsSnapshots,
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					metricsWindowMinutes: 10,
				}),
				"Metrics aggregation worker scheduled",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("stops metrics worker on shutdown", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});

			// Get the expected metrics schedule (from env var or default)
			const expectedMetricsSchedule =
				process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE || "*/5 * * * *";

			await startBackgroundWorkers(
				mockDrizzleClient,
				mockLogger,
				mockGetMetricsSnapshots,
			);

			// Find the metrics task by matching its schedule expression
			const cron = await import("node-cron");
			const scheduleCalls = vi.mocked(cron.default.schedule);
			const metricsTaskCallIndex = scheduleCalls.mock.calls.findIndex(
				(call) => call[0] === expectedMetricsSchedule,
			);
			expect(metricsTaskCallIndex).toBeGreaterThanOrEqual(0);
			const metricsTask = scheduleCalls.mock.results[
				metricsTaskCallIndex
			]?.value as ScheduledTask;
			expect(metricsTask).toBeDefined();

			await stopBackgroundWorkers(mockLogger);

			expect(metricsTask.stop).toHaveBeenCalled();
		});
	});

	describe("runMetricsAggregationWorkerSafely", () => {
		it("logs successful metrics aggregation run", async () => {
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			vi.mocked(runMetricsAggregationWorker).mockResolvedValue({
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
			});

			await runMetricsAggregationWorkerSafely(
				mockGetMetricsSnapshots,
				5,
				mockLogger,
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Starting metrics aggregation worker run",
			);

			expect(mockLogger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
				}),
				"Metrics aggregation worker completed successfully",
			);
		});

		it("logs metrics aggregation failure", async () => {
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			vi.mocked(runMetricsAggregationWorker).mockRejectedValue(
				new Error("Metrics aggregation failed"),
			);

			await runMetricsAggregationWorkerSafely(
				mockGetMetricsSnapshots,
				5,
				mockLogger,
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					error: "Metrics aggregation failed",
					stack: expect.any(String),
				}),
				"Metrics aggregation worker failed",
			);
		});

		it("handles non-Error exceptions", async () => {
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			vi.mocked(runMetricsAggregationWorker).mockRejectedValue("String error");

			await runMetricsAggregationWorkerSafely(
				mockGetMetricsSnapshots,
				5,
				mockLogger,
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Unknown error",
				}),
				"Metrics aggregation worker failed",
			);
		});
	});

	describe("getBackgroundWorkerStatus", () => {
		it("includes metrics schedule when metrics is enabled", async () => {
			process.env.API_METRICS_AGGREGATION_ENABLED = "true";
			process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE = "*/10 * * * *";

			const status = getBackgroundWorkerStatus();

			expect(status.metricsSchedule).toBe("*/10 * * * *");
			expect(status.metricsEnabled).toBe(true);
		});

		it("does not include metrics schedule when metrics is disabled", () => {
			process.env.API_METRICS_AGGREGATION_ENABLED = "false";

			const status = getBackgroundWorkerStatus();

			expect(status.metricsSchedule).toBeUndefined();
			expect(status.metricsEnabled).toBeUndefined();
		});

		it("uses default metrics schedule when not set", () => {
			process.env.API_METRICS_AGGREGATION_ENABLED = "true";
			delete process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE;

			const status = getBackgroundWorkerStatus();

			expect(status.metricsSchedule).toBe("*/5 * * * *");
			expect(status.metricsEnabled).toBe(true);
		});
	});
});
