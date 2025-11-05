import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import type { ScheduleOptions, ScheduledTask } from "node-cron";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as schema from "~/src/drizzle/schema";

import {
	runCleanupWorkerSafely,
	runMaterializationWorkerSafely,
	startBackgroundWorkers,
	stopBackgroundWorkers,
} from "~/src/workers/backgroundWorkerService";

// --- Mocks ---

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
				// Only auto-run the *first* scheduled task (materialization worker)
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

	// ---- runMaterializationWorkerSafely ----
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
	});

	// ---- runCleanupWorkerSafely ----
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
	});

	// ---- startBackgroundWorkers / stopBackgroundWorkers ----
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
	});
});
