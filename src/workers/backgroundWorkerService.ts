import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import cron from "node-cron";
import type * as schema from "~/src/drizzle/schema";
import { EventCleanupWorker } from "./eventCleanupWorker";
import {
	type WorkerConfig,
	type WorkerResult,
	createDefaultWorkerConfig,
	runMaterializationWorker,
} from "./eventMaterialization/workerOrchestrator";

/**
 * Background worker service that orchestrates all event materialization tasks.
 *
 * This service manages:
 * - Event instance materialization (generating future instances)
 * - Instance cleanup (removing old instances)
 * - Worker scheduling and coordination
 * - Error handling and monitoring
 */
export class BackgroundWorkerService {
	private cleanupWorker: EventCleanupWorker;
	private materializationTask?: cron.ScheduledTask;
	private cleanupTask?: cron.ScheduledTask;
	private isRunning = false;
	private materializationConfig: WorkerConfig;

	constructor(
		private readonly drizzleClient: NodePgDatabase<typeof schema>,
		private readonly logger: FastifyBaseLogger,
	) {
		this.cleanupWorker = new EventCleanupWorker(drizzleClient, logger);
		this.materializationConfig = createDefaultWorkerConfig();
	}

	/**
	 * Starts all background workers with their respective schedules.
	 */
	async start(): Promise<void> {
		if (this.isRunning) {
			this.logger.warn("Background workers are already running");
			return;
		}

		try {
			this.logger.info("Starting background worker service...");

			// Schedule materialization worker - runs every hour
			this.materializationTask = cron.schedule(
				process.env.MATERIALIZATION_CRON_SCHEDULE || "0 * * * *",
				() => this.runMaterializationWorkerSafely(),
				{
					scheduled: false,
					timezone: "UTC",
				},
			);

			// Schedule cleanup worker - runs daily at 2 AM UTC
			this.cleanupTask = cron.schedule(
				process.env.CLEANUP_CRON_SCHEDULE || "0 2 * * *",
				() => this.runCleanupWorkerSafely(),
				{
					scheduled: false,
					timezone: "UTC",
				},
			);

			// Start the scheduled tasks
			this.materializationTask.start();
			this.cleanupTask.start();

			this.isRunning = true;
			this.logger.info("Background worker service started successfully", {
				materializationSchedule:
					process.env.MATERIALIZATION_CRON_SCHEDULE || "0 * * * *",
				cleanupSchedule: process.env.CLEANUP_CRON_SCHEDULE || "0 2 * * *",
			});

			// Run materialization worker once immediately on startup
			await this.runMaterializationWorkerSafely();
		} catch (error) {
			this.logger.error("Failed to start background worker service:", error);
			throw error;
		}
	}

	/**
	 * Stops all background workers and cleans up resources.
	 */
	async stop(): Promise<void> {
		if (!this.isRunning) {
			this.logger.warn("Background workers are not running");
			return;
		}

		try {
			this.logger.info("Stopping background worker service...");

			if (this.materializationTask) {
				this.materializationTask.stop();
				this.materializationTask = undefined;
			}

			if (this.cleanupTask) {
				this.cleanupTask.stop();
				this.cleanupTask = undefined;
			}

			this.isRunning = false;
			this.logger.info("Background worker service stopped successfully");
		} catch (error) {
			this.logger.error("Error stopping background worker service:", error);
			throw error;
		}
	}

	/**
	 * Runs the materialization worker with comprehensive error handling.
	 */
	private async runMaterializationWorkerSafely(): Promise<void> {
		const startTime = Date.now();
		this.logger.info("Starting materialization worker run");

		try {
			const result: WorkerResult = await runMaterializationWorker(
				this.materializationConfig,
				this.drizzleClient,
				this.logger,
			);

			const duration = Date.now() - startTime;
			this.logger.info("Materialization worker completed successfully", {
				duration: `${duration}ms`,
				organizationsProcessed: result.organizationsProcessed,
				instancesCreated: result.instancesCreated,
				windowsUpdated: result.windowsUpdated,
				errorsEncountered: result.errorsEncountered,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.error("Materialization worker failed", {
				duration: `${duration}ms`,
				error: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	}

	/**
	 * Runs the cleanup worker with comprehensive error handling.
	 */
	private async runCleanupWorkerSafely(): Promise<void> {
		const startTime = Date.now();
		this.logger.info("Starting cleanup worker run");

		try {
			const stats = await this.cleanupWorker.cleanupOldInstances();

			const duration = Date.now() - startTime;
			this.logger.info("Cleanup worker completed successfully", {
				duration: `${duration}ms`,
				organizationsProcessed: stats.organizationsProcessed,
				instancesDeleted: stats.instancesDeleted,
				errorsEncountered: stats.errorsEncountered,
			});
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.error("Cleanup worker failed", {
				duration: `${duration}ms`,
				error: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	}

	/**
	 * Manually triggers the materialization worker (useful for testing/admin).
	 */
	async triggerMaterializationWorker(): Promise<void> {
		if (!this.isRunning) {
			throw new Error("Background worker service is not running");
		}

		this.logger.info("Manually triggering materialization worker");
		await this.runMaterializationWorkerSafely();
	}

	/**
	 * Manually triggers the cleanup worker (useful for testing/admin).
	 */
	async triggerCleanupWorker(): Promise<void> {
		if (!this.isRunning) {
			throw new Error("Background worker service is not running");
		}

		this.logger.info("Manually triggering cleanup worker");
		await this.runCleanupWorkerSafely();
	}

	/**
	 * Gets the current status of the background worker service.
	 */
	getStatus(): {
		isRunning: boolean;
		materializationSchedule: string;
		cleanupSchedule: string;
		nextMaterializationRun?: Date;
		nextCleanupRun?: Date;
	} {
		return {
			isRunning: this.isRunning,
			materializationSchedule:
				process.env.MATERIALIZATION_CRON_SCHEDULE || "0 * * * *",
			cleanupSchedule: process.env.CLEANUP_CRON_SCHEDULE || "0 2 * * *",
		};
	}

	/**
	 * Health check for monitoring systems.
	 */
	async healthCheck(): Promise<{
		status: "healthy" | "unhealthy";
		details: Record<string, unknown>;
	}> {
		try {
			const status = this.getStatus();

			if (!status.isRunning) {
				return {
					status: "unhealthy",
					details: {
						reason: "Background workers not running",
						...status,
					},
				};
			}

			return {
				status: "healthy",
				details: status,
			};
		} catch (error) {
			return {
				status: "unhealthy",
				details: {
					reason: "Health check failed",
					error: error instanceof Error ? error.message : "Unknown error",
				},
			};
		}
	}

	/**
	 * Updates materialization worker configuration
	 */
	updateMaterializationConfig(config: Partial<WorkerConfig>): void {
		this.materializationConfig = {
			...this.materializationConfig,
			...config,
		};
		this.logger.info("Updated materialization worker configuration", config);
	}
}

/**
 * Global instance of the background worker service.
 */
export let backgroundWorkerService: BackgroundWorkerService | null = null;

/**
 * Initializes the global background worker service.
 */
export function initializeBackgroundWorkerService(
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): void {
	if (backgroundWorkerService) {
		throw new Error("Background worker service is already initialized");
	}

	backgroundWorkerService = new BackgroundWorkerService(drizzleClient, logger);
}

/**
 * Gets the global background worker service instance.
 */
export function getBackgroundWorkerService(): BackgroundWorkerService {
	if (!backgroundWorkerService) {
		throw new Error("Background worker service is not initialized");
	}

	return backgroundWorkerService;
}
