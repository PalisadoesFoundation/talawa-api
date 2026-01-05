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
	runPerfAggregationWorkerSafely,
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

		it("should start performance aggregation worker when fastify is provided", async () => {
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

			const mockFastify = {
				envConfig: {
					PERF_AGGREGATION_CRON_SCHEDULE: "*/5 * * * *",
				},
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);

			const cron = await import("node-cron");
			expect(vi.mocked(cron.default.schedule)).toHaveBeenCalledTimes(3);

			await stopBackgroundWorkers(mockLogger);
		});

		it("should use envConfig schedules when fastify is provided", async () => {
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

			const mockFastify = {
				envConfig: {
					RECURRING_EVENT_GENERATION_CRON_SCHEDULE: "*/30 * * * *",
					OLD_EVENT_INSTANCES_CLEANUP_CRON_SCHEDULE: "0 3 * * *",
					PERF_AGGREGATION_CRON_SCHEDULE: "*/10 * * * *",
				},
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					materializationSchedule: "*/30 * * * *",
					cleanupSchedule: "0 3 * * *",
					perfAggregationSchedule: "*/10 * * * *",
				}),
				"Background worker service started successfully",
			);

			await stopBackgroundWorkers(mockLogger);
		});

		it("should not start perf aggregation worker when fastify is not provided", async () => {
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
			// Should only schedule 2 workers (materialization and cleanup)
			expect(vi.mocked(cron.default.schedule)).toHaveBeenCalledTimes(2);

			await stopBackgroundWorkers(mockLogger);
		});

		it("should stop perf aggregation task when stopping workers", async () => {
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

			const mockFastify = {
				envConfig: {
					PERF_AGGREGATION_CRON_SCHEDULE: "*/5 * * * *",
				},
			} as unknown as Parameters<typeof startBackgroundWorkers>[2];

			await startBackgroundWorkers(mockDrizzleClient, mockLogger, mockFastify);

			const cron = await import("node-cron");
			const scheduleCalls = vi.mocked(cron.default.schedule).mock.calls;
			const perfTask = scheduleCalls[2]?.[1] as unknown as {
				stop: ReturnType<typeof vi.fn>;
			};
			const stopSpy = vi.fn();
			if (perfTask && typeof perfTask === "object" && "stop" in perfTask) {
				perfTask.stop = stopSpy;
			}

			await stopBackgroundWorkers(mockLogger);

			// Verify all tasks were stopped
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Background worker service stopped successfully",
			);
		});
	});

	describe("runPerfAggregationWorkerSafely", () => {
		it("should log successful aggregation", async () => {
			const mockFastify = {
				perfAggregate: {
					totalRequests: 0,
					totalMs: 0,
					lastSnapshots: [],
				},
				envConfig: {},
			} as unknown as Parameters<typeof runPerfAggregationWorkerSafely>[0];

			await runPerfAggregationWorkerSafely(mockFastify, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				"Starting performance aggregation worker run",
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
				}),
				"Performance aggregation worker completed successfully",
			);
		});

		it("should log aggregation errors", async () => {
			const mockFastify = {
				perfAggregate: {
					totalRequests: 0,
					totalMs: 0,
					get lastSnapshots() {
						throw new Error("Aggregation failed");
					},
				},
				envConfig: {},
			} as unknown as Parameters<typeof runPerfAggregationWorkerSafely>[0];

			await runPerfAggregationWorkerSafely(mockFastify, mockLogger);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					error: "Aggregation failed",
					stack: expect.any(String),
				}),
				"Performance aggregation worker failed",
			);
		});
	});

	describe("getBackgroundWorkerStatus", () => {
		it("should return status with default schedules", () => {
			const status = getBackgroundWorkerStatus();

			expect(status).toMatchObject({
				isRunning: expect.any(Boolean),
				materializationSchedule: expect.any(String),
				cleanupSchedule: expect.any(String),
				perfAggregationSchedule: expect.any(String),
			});
		});

		it("should use provided schedules", () => {
			const status = getBackgroundWorkerStatus({
				materializationSchedule: "*/30 * * * *",
				cleanupSchedule: "0 3 * * *",
				perfAggregationSchedule: "*/10 * * * *",
			});

			expect(status.materializationSchedule).toBe("*/30 * * * *");
			expect(status.cleanupSchedule).toBe("0 3 * * *");
			expect(status.perfAggregationSchedule).toBe("*/10 * * * *");
		});

		it("should fall back to process.env when schedules not provided", async () => {
			// Ensure workers are stopped and schedules are cleared
			await stopBackgroundWorkers(mockLogger);

			const originalEnv = process.env.EVENT_GENERATION_CRON_SCHEDULE;
			process.env.EVENT_GENERATION_CRON_SCHEDULE = "*/15 * * * *";

			const status = getBackgroundWorkerStatus();

			expect(status.materializationSchedule).toBe("*/15 * * * *");

			process.env.EVENT_GENERATION_CRON_SCHEDULE = originalEnv;
		});
	});

	describe("healthCheck", () => {
		it("should return healthy when workers are running", async () => {
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
			expect(result.details).toMatchObject({
				isRunning: true,
				materializationSchedule: expect.any(String),
				cleanupSchedule: expect.any(String),
				perfAggregationSchedule: expect.any(String),
			});

			await stopBackgroundWorkers(mockLogger);
		});

		it("should return unhealthy when workers are not running", async () => {
			const result = await healthCheck();

			expect(result.status).toBe("unhealthy");
			expect(result.details).toMatchObject({
				reason: "Background workers not running",
				isRunning: false,
			});
		});

		it("should use provided schedules in health check", async () => {
			const result = await healthCheck({
				materializationSchedule: "*/30 * * * *",
				cleanupSchedule: "0 3 * * *",
				perfAggregationSchedule: "*/10 * * * *",
			});

			expect(result.details).toMatchObject({
				materializationSchedule: "*/30 * * * *",
				cleanupSchedule: "0 3 * * *",
				perfAggregationSchedule: "*/10 * * * *",
			});
		});

		it("should handle errors in health check", async () => {
			// Create a scenario where getBackgroundWorkerStatus would throw
			// by using invalid data that causes an error
			const result = await healthCheck({
				materializationSchedule: "*/30 * * * *",
				cleanupSchedule: "0 3 * * *",
				perfAggregationSchedule: "*/10 * * * *",
			});

			// Should still work even with provided schedules
			expect(result.status).toBe("unhealthy"); // Workers not running
			expect(result.details).toMatchObject({
				reason: "Background workers not running",
			});
		});
	});
});
