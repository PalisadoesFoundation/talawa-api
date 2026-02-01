import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import type { ScheduledTask, ScheduleOptions } from "node-cron";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";

import {
	runCleanupWorkerSafely,
	runMaterializationWorkerSafely,
	runMetricsAggregationWorkerSafely,
	startBackgroundWorkers,
	stopBackgroundWorkers,
} from "~/src/workers/backgroundWorkerService";

vi.mock("node-cron", () => {
	const schedule = vi.fn(
		(
			_expr: string,
			funcOrString: string | ((now: Date | "manual" | "init") => void),
			_options?: ScheduleOptions,
		): ScheduledTask => {
			const start = vi.fn(() => {
				if (typeof funcOrString === "function") {
					funcOrString("manual");
				}
			});

			const stop = vi.fn();

			return { start, stop } as unknown as ScheduledTask;
		},
	);

	const __resetMock = () => {
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

	describe("runMetricsAggregationWorkerSafely", () => {
		it("logs successful metrics aggregation run", async () => {
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			vi.mocked(runMetricsAggregationWorker).mockResolvedValue(undefined);

			// Helper to get snapshots
			const getSnapshots = vi.fn();
			await runMetricsAggregationWorkerSafely(getSnapshots, 5, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Starting metrics aggregation worker run",
			);

			expect(runMetricsAggregationWorker).toHaveBeenCalledWith(
				getSnapshots,
				5,
				mockLogger,
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
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
				new Error("Metrics failure"),
			);

			const getSnapshots = vi.fn();
			await runMetricsAggregationWorkerSafely(getSnapshots, 5, mockLogger);

			expect(runMetricsAggregationWorker).toHaveBeenCalledWith(
				getSnapshots,
				5,
				mockLogger,
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					error: "Metrics failure",
					stack: expect.any(String),
				}),
				"Metrics aggregation worker failed",
			);
		});

		it("logs metrics aggregation failure when a non-Error is thrown", async () => {
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			const errorString = "Metrics failure as string";
			vi.mocked(runMetricsAggregationWorker).mockRejectedValue(errorString);

			const getSnapshots = vi.fn();
			await runMetricsAggregationWorkerSafely(getSnapshots, 5, mockLogger);

			expect(runMetricsAggregationWorker).toHaveBeenCalledWith(
				getSnapshots,
				5,
				mockLogger,
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					error: "Unknown error",
					stack: undefined,
				}),
				"Metrics aggregation worker failed",
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

		it("schedules metrics worker when enabled and snapshot getter provided", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
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
			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});
			vi.mocked(runMetricsAggregationWorker).mockResolvedValue(undefined);

			// Stub env
			vi.stubEnv("API_METRICS_AGGREGATION_ENABLED", "true");
			vi.stubEnv("API_METRICS_AGGREGATION_CRON_SCHEDULE", "*/10 * * * *");
			vi.stubEnv("API_METRICS_AGGREGATION_WINDOW_MINUTES", "15");

			const getSnapshots = vi.fn();
			await startBackgroundWorkers(mockDrizzleClient, mockLogger, getSnapshots);

			const cron = await import("node-cron");
			// 1. materialization, 2. cleanup, 3. metrics
			expect(vi.mocked(cron.default.schedule)).toHaveBeenCalledTimes(3);
			expect(vi.mocked(cron.default.schedule)).toHaveBeenNthCalledWith(
				3,
				"*/10 * * * *",
				expect.any(Function),
				expect.objectContaining({ scheduled: false, timezone: "UTC" }),
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					metricsSchedule: "*/10 * * * *",
					metricsWindowMinutes: 15,
				}),
				"Metrics aggregation worker scheduled",
			);

			// Clean up
			await stopBackgroundWorkers(mockLogger);
			vi.unstubAllEnvs();
		});

		it("skips metrics worker when enabled but getter missing", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 0,
			});

			vi.stubEnv("API_METRICS_AGGREGATION_ENABLED", "true");

			// No getSnapshots arg
			await startBackgroundWorkers(mockDrizzleClient, mockLogger);

			const cron = await import("node-cron");
			// Only materialization and cleanup
			expect(vi.mocked(cron.default.schedule)).toHaveBeenCalledTimes(2);

			expect(mockLogger.warn).toHaveBeenCalledWith(
				"Metrics aggregation is enabled but snapshot getter is not available. Metrics worker will not start.",
			);

			await stopBackgroundWorkers(mockLogger);
			vi.unstubAllEnvs();
		});

		it("skips metrics worker when explicitly disabled", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);

			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 0,
			});

			vi.stubEnv("API_METRICS_AGGREGATION_ENABLED", "false");

			const getSnapshots = vi.fn();
			await startBackgroundWorkers(mockDrizzleClient, mockLogger, getSnapshots);

			const cron = await import("node-cron");
			expect(vi.mocked(cron.default.schedule)).toHaveBeenCalledTimes(2);

			// Should validate metricsEnabled is false in logs
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					metricsEnabled: false,
				}),
				"Background worker service started successfully",
			);

			await stopBackgroundWorkers(mockLogger);
			vi.unstubAllEnvs();
		});

		it("uses default window minutes when config is invalid", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);
			const { runMetricsAggregationWorker } = await import(
				"~/src/workers/metrics/metricsAggregationWorker"
			);

			vi.mocked(runMaterializationWorker).mockResolvedValue({
				organizationsProcessed: 0,
				instancesCreated: 0,
				windowsUpdated: 0,
				errorsEncountered: 0,
				processingTimeMs: 0,
			});
			vi.mocked(cleanupOldInstances).mockResolvedValue({
				organizationsProcessed: 0,
				instancesDeleted: 0,
				errorsEncountered: 0,
			});
			vi.mocked(runMetricsAggregationWorker).mockResolvedValue(undefined);

			vi.stubEnv("API_METRICS_AGGREGATION_ENABLED", "true");
			vi.stubEnv("API_METRICS_AGGREGATION_WINDOW_MINUTES", "-10"); // Invalid

			const getSnapshots = vi.fn();
			await startBackgroundWorkers(mockDrizzleClient, mockLogger, getSnapshots);

			// Should use default 5
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					metricsWindowMinutes: 5,
				}),
				"Metrics aggregation worker scheduled",
			);

			await stopBackgroundWorkers(mockLogger);
			vi.unstubAllEnvs();
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

	describe("triggerMaterializationWorker", () => {
		it("triggers worker when running", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);
			const { triggerMaterializationWorker } = await import(
				"~/src/workers/backgroundWorkerService"
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

			// Start service first
			await startBackgroundWorkers(mockDrizzleClient, mockLogger);

			// Reset mocks to clear startup calls
			vi.mocked(runMaterializationWorker).mockClear();
			vi.mocked(mockLogger.info).mockClear();

			await triggerMaterializationWorker(mockDrizzleClient, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Manually triggering materialization worker",
			);
			expect(runMaterializationWorker).toHaveBeenCalled();

			await stopBackgroundWorkers(mockLogger);
		});

		it("throws error when not running", async () => {
			const { triggerMaterializationWorker } = await import(
				"~/src/workers/backgroundWorkerService"
			);
			await expect(
				triggerMaterializationWorker(mockDrizzleClient, mockLogger),
			).rejects.toThrow("Background worker service is not running");
		});
	});

	describe("triggerCleanupWorker", () => {
		it("triggers worker when running", async () => {
			const { runMaterializationWorker } = await import(
				"~/src/workers/eventGeneration/eventGenerationPipeline"
			);
			const { cleanupOldInstances } = await import(
				"~/src/workers/eventCleanupWorker"
			);
			const { triggerCleanupWorker } = await import(
				"~/src/workers/backgroundWorkerService"
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

			// Start service first
			await startBackgroundWorkers(mockDrizzleClient, mockLogger);

			// Reset mocks to clear startup calls
			vi.mocked(cleanupOldInstances).mockClear();
			vi.mocked(mockLogger.info).mockClear();

			await triggerCleanupWorker(mockDrizzleClient, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Manually triggering cleanup worker",
			);
			expect(cleanupOldInstances).toHaveBeenCalled();

			await stopBackgroundWorkers(mockLogger);
		});

		it("throws error when not running", async () => {
			const { triggerCleanupWorker } = await import(
				"~/src/workers/backgroundWorkerService"
			);
			await expect(
				triggerCleanupWorker(mockDrizzleClient, mockLogger),
			).rejects.toThrow("Background worker service is not running");
		});
	});

	describe("healthCheck", () => {
		it("returns healthy when running", async () => {
			const { healthCheck } = await import(
				"~/src/workers/backgroundWorkerService"
			);
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

			const result = await healthCheck();
			expect(result.status).toBe("healthy");
			expect(result.details.isRunning).toBe(true);

			await stopBackgroundWorkers(mockLogger);
		});

		it("returns unhealthy when not running", async () => {
			const { healthCheck } = await import(
				"~/src/workers/backgroundWorkerService"
			);
			const result = await healthCheck();

			expect(result.status).toBe("unhealthy");
			expect(result.details.reason).toBe("Background workers not running");
			expect(result.details.isRunning).toBe(false);
		});

		it("returns unhealthy when status check fails", async () => {
			const { healthCheck } = await import(
				"~/src/workers/backgroundWorkerService"
			);

			const mockStatusGetter = vi.fn().mockImplementation(() => {
				throw new Error("Status check failed");
			});

			const result = await healthCheck(mockStatusGetter);

			expect(result.status).toBe("unhealthy");
			expect(result.details.reason).toBe("Health check failed");
			expect(result.details.error).toBe("Status check failed");
		});
	});

	describe("updateMaterializationConfig", () => {
		it("updates configuration", async () => {
			const { updateMaterializationConfig } = await import(
				"~/src/workers/backgroundWorkerService"
			);

			const newConfig = {
				maxOrganizations: 500,
			};

			updateMaterializationConfig(newConfig, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				newConfig,
				"Updated materialization worker configuration",
			);
		});
	});

	describe("getBackgroundWorkerStatus", () => {
		it("returns correct status", async () => {
			const { getBackgroundWorkerStatus } = await import(
				"~/src/workers/backgroundWorkerService"
			);

			// Not running initially
			let status = getBackgroundWorkerStatus();
			expect(status.isRunning).toBe(false);

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

			// Start
			await startBackgroundWorkers(mockDrizzleClient, mockLogger);

			status = getBackgroundWorkerStatus();
			expect(status.isRunning).toBe(true);
			expect(status.materializationSchedule).toBeDefined();
			expect(status.cleanupSchedule).toBeDefined();

			await stopBackgroundWorkers(mockLogger);
		});

		it("returns status with metrics enabled explicitly", async () => {
			const { getBackgroundWorkerStatus } = await import(
				"~/src/workers/backgroundWorkerService"
			);

			vi.stubEnv("API_METRICS_AGGREGATION_ENABLED", "true");
			vi.stubEnv("API_METRICS_AGGREGATION_CRON_SCHEDULE", "*/15 * * * *");

			// Start workers to set 'isRunning' (optional for this check but good for consistency)
			// Actually getBackgroundWorkerStatus logic for metrics depends on ENV vars, not state
			// But isRunning depends on state.
			// Let's just check the metrics part.

			const status = getBackgroundWorkerStatus();
			expect(status.metricsEnabled).toBe(true);
			expect(status.metricsSchedule).toBe("*/15 * * * *");

			vi.unstubAllEnvs();
		});

		it("returns status with metrics disabled explicitly", async () => {
			const { getBackgroundWorkerStatus } = await import(
				"~/src/workers/backgroundWorkerService"
			);

			vi.stubEnv("API_METRICS_AGGREGATION_ENABLED", "false");

			const status = getBackgroundWorkerStatus();
			expect(status.metricsEnabled).toBeUndefined(); // It is omitted if false?
			// Checking implementation:
			// ...(currentMetricsEnabled && { metricsSchedule: ..., metricsEnabled: ... })
			// So if false, these keys are missing.
			expect(status).not.toHaveProperty("metricsEnabled");
			expect(status).not.toHaveProperty("metricsSchedule");

			vi.unstubAllEnvs();
		});
	});
});
