import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import type { ScheduledTask, ScheduleOptions } from "node-cron";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";

import {
	runCleanupWorkerSafely,
	runMaterializationWorkerSafely,
	startBackgroundWorkers,
	stopBackgroundWorkers,
	warmCacheSafely,
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
	});

	describe("warmCacheSafely", () => {
		it("should warm cache with organizations successfully", async () => {
			const mockOrganizations = [
				{ id: "org1", name: "Org 1", createdAt: new Date() },
				{ id: "org2", name: "Org 2", createdAt: new Date() },
			];

			const mockDrizzleWithQuery = {
				query: {
					organizationsTable: {
						findMany: vi.fn().mockResolvedValue(mockOrganizations),
					},
				},
			} as unknown as NodePgDatabase<typeof schema>;

			const mockCache = {
				set: vi.fn().mockResolvedValue(undefined),
			};

			await warmCacheSafely(
				mockDrizzleWithQuery,
				mockCache as never,
				mockLogger,
			);

			expect(mockLogger.info).toHaveBeenCalledWith("Starting cache warming");
			expect(mockCache.set).toHaveBeenCalledTimes(2);
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					organizationsWarmed: 2,
				}),
				"Cache warming completed successfully",
			);
		});

		it("should handle cache warming failure gracefully (non-fatal)", async () => {
			const mockDrizzleWithQuery = {
				query: {
					organizationsTable: {
						findMany: vi.fn().mockRejectedValue(new Error("Database error")),
					},
				},
			} as unknown as NodePgDatabase<typeof schema>;

			const mockCache = {
				set: vi.fn(),
			};

			// Should not throw - cache warming failures are non-fatal
			await expect(
				warmCacheSafely(mockDrizzleWithQuery, mockCache as never, mockLogger),
			).resolves.not.toThrow();

			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					duration: expect.stringMatching(/^\d+ms$/),
					error: "Database error",
				}),
				"Cache warming failed (non-fatal)",
			);
		});

		it("should handle non-Error thrown during cache warming", async () => {
			const mockDrizzleWithQuery = {
				query: {
					organizationsTable: {
						findMany: vi.fn().mockRejectedValue("String error"),
					},
				},
			} as unknown as NodePgDatabase<typeof schema>;

			const mockCache = {
				set: vi.fn(),
			};

			await expect(
				warmCacheSafely(mockDrizzleWithQuery, mockCache as never, mockLogger),
			).resolves.not.toThrow();

			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Unknown error",
				}),
				"Cache warming failed (non-fatal)",
			);
		});

		it("should warm zero organizations when database is empty", async () => {
			const mockDrizzleWithQuery = {
				query: {
					organizationsTable: {
						findMany: vi.fn().mockResolvedValue([]),
					},
				},
			} as unknown as NodePgDatabase<typeof schema>;

			const mockCache = {
				set: vi.fn(),
			};

			await warmCacheSafely(
				mockDrizzleWithQuery,
				mockCache as never,
				mockLogger,
			);

			expect(mockCache.set).not.toHaveBeenCalled();
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationsWarmed: 0,
				}),
				"Cache warming completed successfully",
			);
		});
	});
});
