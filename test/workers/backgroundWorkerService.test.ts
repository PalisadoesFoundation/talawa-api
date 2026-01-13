import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import type { ScheduledTask, ScheduleOptions } from "node-cron";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";

import {
	getBackgroundWorkerStatus,
	healthCheck,
	runCleanupWorkerSafely,
	runMaterializationWorkerSafely,
	runMetricsAggregationWorkerSafely,
	startBackgroundWorkers,
	stopBackgroundWorkers,
	triggerCleanupWorker,
	triggerMaterializationWorker,
	triggerMetricsAggregationWorker,
	updateMaterializationConfig,
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

describe("backgroundServiceWorker", () => {
	let mockDrizzleClient: NodePgDatabase<typeof schema>;
	let mockLogger: FastifyBaseLogger;

	beforeEach(async () => {
		vi.clearAllMocks();

		const cron = await import("node-cron");
		(cron as { __resetMock?: () => void }).__resetMock?.();

		// Ensure workers are stopped before each test for proper isolation
		const cleanupLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as FastifyBaseLogger;

		// Always try to stop workers to ensure clean state
		// This will clear fastifyInstance if workers were running
		await stopBackgroundWorkers(cleanupLogger).catch(() => {
			// Ignore errors if workers aren't running
		});

		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
		} as unknown as FastifyBaseLogger;

		mockDrizzleClient = {} as unknown as NodePgDatabase<typeof schema>;
	});

	describe("runMaterializationWorkerSafely", () => {
		it("logs successful materialization run", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 3,
				instancesCreated: 10,
				windowsUpdated: 2,
				errorsEncountered: 0,
				processingTimeMs: 123,
			});

			await runMaterializationWorkerSafely(mockDrizzleClient, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Starting materialization worker run",
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					organizationsProcessed: 3,
					instancesCreated: 10,
					windowsUpdated: 2,
					errorsEncountered: 0,
				}),
				"Materialization worker completed successfully",
			);
		});

		it("logs failure", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);

			vi.mocked(runMaterializationWorker).mockRejectedValue(
				new Error("Materialization boom"),
			);

			await runMaterializationWorkerSafely(mockDrizzleClient, mockLogger);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					error: "Materialization boom",
					stack: expect.any(String),
				}),
				"Materialization worker failed",
			);
		});

		it("logs failure when a non-Error is thrown", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);

			const errorString = "Materialization failure as string";
			vi.mocked(runMaterializationWorker).mockRejectedValue(errorString);

			await runMaterializationWorkerSafely(mockDrizzleClient, mockLogger);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					error: "Unknown error",
					stack: undefined,
				}),
				"Materialization worker failed",
			);
		});
	});

	describe("runCleanupWorkerSafely", () => {
		it("logs successful cleanup run", async () => {
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 1,
				instancesDeleted: 5,
				errorsEncountered: 0,
			});

			await runCleanupWorkerSafely(mockDrizzleClient, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Starting cleanup worker run",
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					organizationsProcessed: 1,
					instancesDeleted: 5,
					errorsEncountered: 0,
				}),
				"Cleanup worker completed successfully",
			);
		});

		it("logs cleanup failure", async () => {
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			vi.mocked(cleanupOldInstances).mockRejectedValue(
				new Error("Cleanup failure"),
			);

			await runCleanupWorkerSafely(mockDrizzleClient, mockLogger);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					error: "Cleanup failure",
					stack: expect.any(String),
				}),
				"Cleanup worker failed",
			);
		});

		it("logs cleanup failure when a non-Error is thrown", async () => {
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			const errorString = "Cleanup failure as string";
			vi.mocked(cleanupOldInstances).mockRejectedValue(errorString);

			await runCleanupWorkerSafely(mockDrizzleClient, mockLogger);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					error: "Unknown error",
					stack: undefined,
				}),
				"Cleanup worker failed",
			);
		});
	});

	describe("startBackgroundWorkers / stopBackgroundWorkers", () => {
		it("starts and stops workers", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 3,
				instancesCreated: 10,
				windowsUpdated: 2,
				errorsEncountered: 0,
				processingTimeMs: 123,
			});

			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});

			await startBackgroundWorkers(mockDrizzleClient, mockLogger);
			const cron = await import("node-cron");
			expect(vi.mocked(cron.default.schedule)).toHaveBeenNthCalledWith(
				1,
				expect.any(String),
				expect.any(Function),
				expect.objectContaining({ scheduled: false, timezone: "UTC" }),
			);
			expect(vi.mocked(cron.default.schedule)).toHaveBeenNthCalledWith(
				2,
				expect.any(String),
				expect.any(Function),
				expect.objectContaining({ scheduled: false, timezone: "UTC" }),
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					materializationSchedule: expect.any(String),
					cleanupSchedule: expect.any(String),
				}),
				"Background worker service started successfully",
			);

			await stopBackgroundWorkers(mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Background worker service stopped successfully",
			);
		});

		it("stops metricsTask when stopping workers with metrics enabled", async () => {
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

			const cron = await import("node-cron");
			const metricsTaskStop = vi.fn();
			const metricsTask: Partial<ScheduledTask> = {
				start: vi.fn(),
				stop: metricsTaskStop,
			};

			vi.mocked(cron.default.schedule)
				.mockImplementationOnce(
					() =>
						({
							start: vi.fn(),
							stop: vi.fn(),
						}) as unknown as ScheduledTask,
				)
				.mockImplementationOnce(
					() =>
						({
							start: vi.fn(),
							stop: vi.fn(),
						}) as unknown as ScheduledTask,
				)
				.mockImplementationOnce(() => metricsTask as unknown as ScheduledTask);

			const mockFastify = {
				envConfig: {
					METRICS_AGGREGATION_ENABLED: true,
					METRICS_AGGREGATION_CRON_SCHEDULE: "*/5 * * * *",
					METRICS_AGGREGATION_WINDOW_MINUTES: 5,
					METRICS_SNAPSHOT_RETENTION_COUNT: 1000,
					METRICS_SLOW_THRESHOLD_MS: 200,
				},
				getPerformanceSnapshots: vi.fn().mockReturnValue([]),
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);
			await stopBackgroundWorkers(mockLogger);

			// Verify metricsTask.stop() was called when stopping workers with metrics enabled
			expect(metricsTaskStop).toHaveBeenCalled();
		});

		it("warns if already running", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			await startBackgroundWorkers(mockDrizzleClient, mockLogger);
			await startBackgroundWorkers(mockDrizzleClient, mockLogger);

			expect(mockLogger.warn).toHaveBeenCalledWith(
				"Background workers are already running",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("warns on stop when not running", async () => {
			await stopBackgroundWorkers(mockLogger);

			expect(mockLogger.warn).toHaveBeenCalledWith(
				"Background workers are not running",
			);
		});

		it("logs error and rejects if stop() throws", async () => {
			const cron = await import("node-cron");

			const stopMock = vi.fn().mockImplementationOnce(() => {
				throw new Error("stop boom");
			});

			const thrownTask: Partial<ScheduledTask> = {
				start: vi.fn(),
				stop: stopMock,
			};

			const normalTask: Partial<ScheduledTask> = {
				start: vi.fn(),
				stop: vi.fn(),
			};

			vi.mocked(cron.default.schedule)
				.mockImplementationOnce(() => thrownTask as ScheduledTask)
				.mockImplementationOnce(() => normalTask as ScheduledTask);

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

			await expect(
				startBackgroundWorkers(mockDrizzleClient, mockLogger),
			).resolves.toBeUndefined();

			await expect(stopBackgroundWorkers(mockLogger)).rejects.toThrow(
				"stop boom",
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.any(Error),
				"Error stopping background worker service:",
			);
			stopMock.mockImplementation(() => {});
			await stopBackgroundWorkers(mockLogger);
		});

		it("logs and re-throws error if startup fails", async () => {
			const cron = await import("node-cron");
			const startupError = new Error("Cron start failed");

			const failingTask: Partial<ScheduledTask> = {
				start: vi.fn().mockImplementation(() => {
					throw startupError;
				}),
				stop: vi.fn(),
			};

			const normalTask: Partial<ScheduledTask> = {
				start: vi.fn(),
				stop: vi.fn(),
			};

			// Apply the mocks
			vi.mocked(cron.default.schedule)
				.mockImplementationOnce(() => failingTask as ScheduledTask)
				.mockImplementationOnce(() => normalTask as ScheduledTask);

			await expect(
				startBackgroundWorkers(mockDrizzleClient, mockLogger),
			).rejects.toThrow("Cron start failed");

			expect(mockLogger.error).toHaveBeenCalledWith(
				startupError,
				"Failed to start background worker service",
			);
		});
	});

	describe("triggerCleanupWorker", () => {
		it("throws error when service is not running", async () => {
			await expect(
				triggerCleanupWorker(mockDrizzleClient, mockLogger),
			).rejects.toThrow("Background worker service is not running");
		});

		it("calls runCleanupWorkerSafely when service is running", async () => {
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
				organizationsProcessed: 1,
				instancesDeleted: 2,
				errorsEncountered: 0,
			});

			await startBackgroundWorkers(mockDrizzleClient, mockLogger);

			await triggerCleanupWorker(mockDrizzleClient, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Manually triggering cleanup worker",
			);
			expect(cleanupOldInstances).toHaveBeenCalled();

			await stopBackgroundWorkers(mockLogger);
		});
	});

	describe("triggerMaterializationWorker", () => {
		it("throws error when service is not running", async () => {
			await expect(
				triggerMaterializationWorker(mockDrizzleClient, mockLogger),
			).rejects.toThrow("Background worker service is not running");
		});

		it("calls runMaterializationWorkerSafely when service is running", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			await startBackgroundWorkers(mockDrizzleClient, mockLogger);

			await triggerMaterializationWorker(mockDrizzleClient, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Manually triggering materialization worker",
			);
			expect(runMaterializationWorker).toHaveBeenCalled();

			await stopBackgroundWorkers(mockLogger);
		});
	});

	describe("triggerMetricsAggregationWorker", () => {
		it("throws error when service is not running", async () => {
			await expect(triggerMetricsAggregationWorker(mockLogger)).rejects.toThrow(
				"Background worker service is not running",
			);
		});

		it("throws error when fastifyInstance is not available", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			await startBackgroundWorkers(mockDrizzleClient, mockLogger);

			await expect(triggerMetricsAggregationWorker(mockLogger)).rejects.toThrow(
				"Fastify instance is not available for metrics aggregation",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("calls runMetricsAggregationWorkerSafely when service is running and fastify is available", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			vi.mocked(runMetricsAggregationWorker).mockReturnValue({
				metrics: {
					timestamp: Date.now(),
					windowMinutes: 5,
					snapshotCount: 0,
					operations: {},
					cache: {
						totalHits: 0,
						totalMisses: 0,
						totalOps: 0,
						hitRate: 0,
					},
					slowOperationCount: 0,
					avgTotalMs: 0,
					minTotalMs: 0,
					maxTotalMs: 0,
					medianTotalMs: 0,
					p95TotalMs: 0,
					p99TotalMs: 0,
				},
				snapshotsProcessed: 0,
				aggregationDurationMs: 10,
				error: undefined, // No error for successful run
			});

			const mockFastify = {
				envConfig: {
					METRICS_AGGREGATION_ENABLED: true,
					METRICS_AGGREGATION_CRON_SCHEDULE: "*/5 * * * *",
					METRICS_AGGREGATION_WINDOW_MINUTES: 5,
					METRICS_SNAPSHOT_RETENTION_COUNT: 1000,
					METRICS_SLOW_THRESHOLD_MS: 200,
				},
				getPerformanceSnapshots: vi.fn().mockReturnValue([]),
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);

			await triggerMetricsAggregationWorker(mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Manually triggering metrics aggregation worker",
			);

			await stopBackgroundWorkers(mockLogger);
		});
	});

	describe("runMetricsAggregationWorkerSafely", () => {
		it("warns and returns early when fastifyInstance is not available", async () => {
			await runMetricsAggregationWorkerSafely(mockLogger);

			expect(mockLogger.warn).toHaveBeenCalledWith(
				"Metrics aggregation worker cannot run: Fastify instance not available",
			);
		});

		it("logs successful metrics aggregation run", async () => {
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			const mockFastify = {
				envConfig: {
					METRICS_AGGREGATION_WINDOW_MINUTES: 10,
					METRICS_SNAPSHOT_RETENTION_COUNT: 500,
					METRICS_SLOW_THRESHOLD_MS: 200,
				},
				getPerformanceSnapshots: vi.fn().mockReturnValue([]),
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);

			vi.mocked(runMetricsAggregationWorker).mockReturnValue({
				metrics: {
					timestamp: Date.now(),
					windowMinutes: 10,
					snapshotCount: 2,
					operations: {
						db: {
							count: 5,
							totalMs: 250,
							avgMs: 50,
							minMs: 10,
							maxMs: 100,
							medianMs: 50,
							p95Ms: 95,
							p99Ms: 99,
						},
					},
					cache: {
						totalHits: 10,
						totalMisses: 5,
						totalOps: 15,
						hitRate: 0.667,
					},
					slowOperationCount: 1,
					avgTotalMs: 125,
					minTotalMs: 50,
					maxTotalMs: 200,
					medianTotalMs: 125,
					p95TotalMs: 190,
					p99TotalMs: 198,
				},
				snapshotsProcessed: 2,
				aggregationDurationMs: 15,
				error: undefined, // No error for successful run
			});

			await runMetricsAggregationWorkerSafely(mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Starting metrics aggregation worker run",
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					snapshotsProcessed: 2,
					aggregationDuration: "15ms",
					operationsCount: 1,
					cacheHitRate: 0.667,
					slowOperations: 1,
					avgTotalMs: 125,
					p95TotalMs: 190,
					p99TotalMs: 198,
				}),
				"Metrics aggregation worker completed successfully",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("logs error when metrics aggregation fails", async () => {
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			const mockFastify = {
				envConfig: {
					METRICS_AGGREGATION_WINDOW_MINUTES: 5,
					METRICS_SNAPSHOT_RETENTION_COUNT: 1000,
					METRICS_SLOW_THRESHOLD_MS: 200,
				},
				getPerformanceSnapshots: vi.fn().mockReturnValue([]),
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);

			const aggregationError = new Error("Metrics aggregation failed");
			vi.mocked(runMetricsAggregationWorker).mockReturnValue({
				metrics: {
					timestamp: Date.now(),
					windowMinutes: 5,
					snapshotCount: 0,
					operations: {},
					cache: {
						totalHits: 0,
						totalMisses: 0,
						totalOps: 0,
						hitRate: 0,
					},
					slowOperationCount: 0,
					avgTotalMs: 0,
					minTotalMs: 0,
					maxTotalMs: 0,
					medianTotalMs: 0,
					p95TotalMs: 0,
					p99TotalMs: 0,
				},
				snapshotsProcessed: 0,
				aggregationDurationMs: 10,
				error: aggregationError, // Error field indicates failure
			});

			await runMetricsAggregationWorkerSafely(mockLogger);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					snapshotsProcessed: 0,
					aggregationDuration: "10ms",
					error: "Metrics aggregation failed",
					stack: expect.any(String),
				}),
				"Metrics aggregation worker failed",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("logs error when metrics aggregation fails with non-Error", async () => {
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			const mockFastify = {
				envConfig: {
					METRICS_AGGREGATION_WINDOW_MINUTES: 5,
					METRICS_SNAPSHOT_RETENTION_COUNT: 1000,
					METRICS_SLOW_THRESHOLD_MS: 200,
				},
				getPerformanceSnapshots: vi.fn().mockReturnValue([]),
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);

			vi.mocked(runMetricsAggregationWorker).mockReturnValue({
				metrics: {
					timestamp: Date.now(),
					windowMinutes: 5,
					snapshotCount: 0,
					operations: {},
					cache: {
						totalHits: 0,
						totalMisses: 0,
						totalOps: 0,
						hitRate: 0,
					},
					slowOperationCount: 0,
					avgTotalMs: 0,
					minTotalMs: 0,
					maxTotalMs: 0,
					medianTotalMs: 0,
					p95TotalMs: 0,
					p99TotalMs: 0,
				},
				snapshotsProcessed: 0,
				aggregationDurationMs: 10,
				error: "String error", // Error field indicates failure (can be string)
			});

			await runMetricsAggregationWorkerSafely(mockLogger);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					snapshotsProcessed: 0,
					aggregationDuration: "10ms",
					error: "String error",
					stack: undefined,
				}),
				"Metrics aggregation worker failed",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("logs error when worker result contains error", async () => {
			// Mock runMetricsAggregationWorker to return a result with error field
			// This simulates what happens when getSnapshots throws inside the worker:
			// The worker catches the error and returns a result with the error field set
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			const snapshotError = new Error("Snapshot retrieval failed");
			vi.mocked(runMetricsAggregationWorker).mockReturnValue({
				metrics: {
					timestamp: Date.now(),
					windowMinutes: 5,
					snapshotCount: 0,
					operations: {},
					cache: {
						totalHits: 0,
						totalMisses: 0,
						totalOps: 0,
						hitRate: 0,
					},
					slowOperationCount: 0,
					avgTotalMs: 0,
					minTotalMs: 0,
					maxTotalMs: 0,
					medianTotalMs: 0,
					p95TotalMs: 0,
					p99TotalMs: 0,
				},
				snapshotsProcessed: 0,
				aggregationDurationMs: 5,
				error: snapshotError, // Error indicates getSnapshots threw
			});

			const mockFastify = {
				envConfig: {
					METRICS_AGGREGATION_WINDOW_MINUTES: 5,
					METRICS_SNAPSHOT_RETENTION_COUNT: 1000,
					METRICS_SLOW_THRESHOLD_MS: 200,
				},
				getPerformanceSnapshots: vi.fn().mockReturnValue([]),
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);
			await runMetricsAggregationWorkerSafely(mockLogger);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					snapshotsProcessed: 0,
					aggregationDuration: "5ms",
					error: "Snapshot retrieval failed",
					stack: expect.any(String),
				}),
				"Metrics aggregation worker failed",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("logs error when result has error and snapshotsProcessed is undefined", async () => {
			// Test line 344: result.snapshotsProcessed ?? 0
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			const mockFastify = {
				envConfig: {
					METRICS_AGGREGATION_WINDOW_MINUTES: 5,
					METRICS_SNAPSHOT_RETENTION_COUNT: 1000,
					METRICS_SLOW_THRESHOLD_MS: 200,
				},
				getPerformanceSnapshots: vi.fn().mockReturnValue([]),
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);

			const aggregationError = new Error("Aggregation error");
			vi.mocked(runMetricsAggregationWorker).mockReturnValue({
				metrics: {
					timestamp: Date.now(),
					windowMinutes: 5,
					snapshotCount: 0,
					operations: {},
					cache: {
						totalHits: 0,
						totalMisses: 0,
						totalOps: 0,
						hitRate: 0,
					},
					slowOperationCount: 0,
					avgTotalMs: 0,
					minTotalMs: 0,
					maxTotalMs: 0,
					medianTotalMs: 0,
					p95TotalMs: 0,
					p99TotalMs: 0,
				},
				// snapshotsProcessed is undefined to test the ?? 0 fallback
				snapshotsProcessed: undefined,
				aggregationDurationMs: undefined,
				error: aggregationError,
			} as unknown as ReturnType<typeof runMetricsAggregationWorker>);

			await runMetricsAggregationWorkerSafely(mockLogger);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					snapshotsProcessed: 0, // Should use 0 fallback when undefined
					aggregationDuration: expect.stringMatching(/^\d+ms$/), // Should use duration fallback
					error: "Aggregation error",
					stack: expect.any(String),
				}),
				"Metrics aggregation worker failed",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("logs error when result is undefined", async () => {
			// Test lines 358-365: handle undefined result defensively
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			const mockFastify = {
				envConfig: {
					METRICS_AGGREGATION_WINDOW_MINUTES: 5,
					METRICS_SNAPSHOT_RETENTION_COUNT: 1000,
					METRICS_SLOW_THRESHOLD_MS: 200,
				},
				getPerformanceSnapshots: vi.fn().mockReturnValue([]),
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);

			// Mock to return undefined (shouldn't happen but handle defensively)
			vi.mocked(runMetricsAggregationWorker).mockReturnValue(
				undefined as unknown as ReturnType<typeof runMetricsAggregationWorker>,
			);

			await runMetricsAggregationWorkerSafely(mockLogger);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					error: "Metrics aggregation worker returned undefined result",
				}),
				"Metrics aggregation worker failed",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("logs error when runMetricsAggregationWorker throws exception", async () => {
			// Test lines 386-402: catch block handles exceptions thrown before result is assigned
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			const mockFastify = {
				envConfig: {
					METRICS_AGGREGATION_WINDOW_MINUTES: 5,
					METRICS_SNAPSHOT_RETENTION_COUNT: 1000,
					METRICS_SLOW_THRESHOLD_MS: 200,
				},
				getPerformanceSnapshots: vi.fn().mockReturnValue([]),
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);

			const thrownError = new Error("Worker threw exception");
			// Mock to throw an exception (simulating error before result assignment)
			vi.mocked(runMetricsAggregationWorker).mockImplementation(() => {
				throw thrownError;
			});

			await runMetricsAggregationWorkerSafely(mockLogger);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					snapshotsProcessed: 0, // result is undefined, so ?? 0
					aggregationDuration: expect.stringMatching(/^\d+ms$/), // result is undefined, so use duration
					error: "Worker threw exception",
					stack: expect.any(String),
				}),
				"Metrics aggregation worker failed",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("logs error when runMetricsAggregationWorker throws non-Error exception", async () => {
			// Test lines 389-402: catch block handles non-Error exceptions
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			const mockFastify = {
				envConfig: {
					METRICS_AGGREGATION_WINDOW_MINUTES: 5,
					METRICS_SNAPSHOT_RETENTION_COUNT: 1000,
					METRICS_SLOW_THRESHOLD_MS: 200,
				},
				getPerformanceSnapshots: vi.fn().mockReturnValue([]),
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);

			// Mock to throw a non-Error exception
			vi.mocked(runMetricsAggregationWorker).mockImplementation(() => {
				throw "String exception";
			});

			await runMetricsAggregationWorkerSafely(mockLogger);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					snapshotsProcessed: 0,
					aggregationDuration: expect.stringMatching(/^\d+ms$/),
					error: "String exception",
					stack: undefined, // Non-Error doesn't have stack
				}),
				"Metrics aggregation worker failed",
			);

			await stopBackgroundWorkers(mockLogger);
		});
	});

	describe("getBackgroundWorkerStatus", () => {
		it("returns status with isRunning false when not started", () => {
			const status = getBackgroundWorkerStatus();

			expect(status.isRunning).toBe(false);
			expect(status.materializationSchedule).toBe("0 * * * *");
			expect(status.cleanupSchedule).toBe("0 2 * * *");
			expect(status.metricsSchedule).toBe("disabled");
		});

		it("returns status with isRunning true and metrics schedule when started with fastify", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			const mockFastify = {
				envConfig: {
					METRICS_AGGREGATION_ENABLED: true,
					METRICS_AGGREGATION_CRON_SCHEDULE: "*/10 * * * *",
					METRICS_AGGREGATION_WINDOW_MINUTES: 5,
					METRICS_SNAPSHOT_RETENTION_COUNT: 1000,
					METRICS_SLOW_THRESHOLD_MS: 200,
				},
				getPerformanceSnapshots: vi.fn().mockReturnValue([]),
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);

			const status = getBackgroundWorkerStatus();

			expect(status.isRunning).toBe(true);
			expect(status.materializationSchedule).toBe("0 * * * *");
			expect(status.cleanupSchedule).toBe("0 2 * * *");
			// The implementation uses the value from fastifyInstance.envConfig, which should be "*/10 * * * *"
			// But if it's not set, it defaults to "*/5 * * * *"
			expect(status.metricsSchedule).toBe("*/10 * * * *");

			await stopBackgroundWorkers(mockLogger);
		});
	});

	describe("healthCheck", () => {
		it("returns unhealthy when workers are not running", async () => {
			const result = await healthCheck();

			expect(result.status).toBe("unhealthy");
			expect(result.details.reason).toBe("Background workers not running");
			expect(result.details.isRunning).toBe(false);
		});

		it("returns healthy when workers are running", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 1,
			});

			await startBackgroundWorkers(mockDrizzleClient, mockLogger);

			const result = await healthCheck();

			expect(result.status).toBe("healthy");
			expect(result.details.isRunning).toBe(true);

			await stopBackgroundWorkers(mockLogger);
		});

		it("returns unhealthy when getBackgroundWorkerStatus throws Error", async () => {
			// Test lines 469-476: catch block handles when getBackgroundWorkerStatus throws
			const statusError = new Error("Status check failed");
			// Import the module to get the same instance that healthCheck uses
			const workerModule = await import(
				"~/src/workers/backgroundWorkerService"
			);
			const statusSpy = vi
				.spyOn(workerModule, "getBackgroundWorkerStatus")
				.mockImplementation(() => {
					throw statusError;
				});

			const result = await workerModule.healthCheck();

			expect(result.status).toBe("unhealthy");
			expect(result.details.reason).toBe("Health check failed");
			expect(result.details.error).toBe("Status check failed");

			statusSpy.mockRestore();
		});

		it("returns unhealthy when getBackgroundWorkerStatus throws non-Error", async () => {
			// Test lines 469-476: catch block handles when getBackgroundWorkerStatus throws non-Error
			// Import the module to get the same instance that healthCheck uses
			const workerModule = await import(
				"~/src/workers/backgroundWorkerService"
			);
			const statusSpy = vi
				.spyOn(workerModule, "getBackgroundWorkerStatus")
				.mockImplementation(() => {
					throw "String error";
				});

			const result = await workerModule.healthCheck();

			expect(result.status).toBe("unhealthy");
			expect(result.details.reason).toBe("Health check failed");
			expect(result.details.error).toBe("String error");

			statusSpy.mockRestore();
		});
	});

	describe("updateMaterializationConfig", () => {
		it("updates configuration and logs the change", () => {
			const newConfig = {
				maxConcurrentJobs: 10,
				maxOrganizations: 100,
			};

			updateMaterializationConfig(newConfig, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				newConfig,
				"Updated materialization worker configuration",
			);
		});
	});
});
