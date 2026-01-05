import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import cron from "node-cron";
import type * as schema from "~/src/drizzle/schema";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";
import { cleanupOldInstances } from "./eventCleanupWorker";
import {
	createDefaultWorkerConfig,
	runMaterializationWorker,
	type WorkerConfig,
	type WorkerResult,
} from "./eventGeneration/eventGenerationPipeline";

let materializationTask: cron.ScheduledTask | undefined;
let cleanupTask: cron.ScheduledTask | undefined;
let isRunning = false;
let materializationConfig: WorkerConfig = createDefaultWorkerConfig();

/**
 * Initializes and starts all background workers, scheduling them to run at their configured intervals.
 */
export async function startBackgroundWorkers(
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<void> {
	if (isRunning) {
		logger.warn("Background workers are already running");
		return;
	}

	try {
		logger.info("Starting background worker service...");

		// Schedule event generation worker - runs every hour
		materializationTask = cron.schedule(
			process.env.EVENT_GENERATION_CRON_SCHEDULE || "0 * * * *",
			() => runMaterializationWorkerSafely(drizzleClient, logger),
			{
				scheduled: false,
				timezone: "UTC",
			},
		);

		// Schedule cleanup worker - runs daily at 2 AM UTC
		cleanupTask = cron.schedule(
			process.env.CLEANUP_CRON_SCHEDULE || "0 2 * * *",
			() => runCleanupWorkerSafely(drizzleClient, logger),
			{
				scheduled: false,
				timezone: "UTC",
			},
		);

		// Start the scheduled tasks
		materializationTask.start();
		cleanupTask.start();

		isRunning = true;
		logger.info(
			{
				materializationSchedule:
					process.env.EVENT_GENERATION_CRON_SCHEDULE || "0 * * * *",
				cleanupSchedule: process.env.CLEANUP_CRON_SCHEDULE || "0 2 * * *",
			},
			"Background worker service started successfully",
		);

		// Run materialization worker once immediately on startup
		await runMaterializationWorkerSafely(drizzleClient, logger);
	} catch (error) {
		logger.error(error, "Failed to start background worker service");
		throw error;
	}
}

/**
 * Stops all running background workers and releases any associated resources.
 */
export async function stopBackgroundWorkers(
	logger: FastifyBaseLogger,
): Promise<void> {
	if (!isRunning) {
		logger.warn("Background workers are not running");
		return;
	}

	try {
		logger.info("Stopping background worker service...");

		if (materializationTask) {
			materializationTask.stop();
			materializationTask = undefined;
		}

		if (cleanupTask) {
			cleanupTask.stop();
			cleanupTask = undefined;
		}

		isRunning = false;
		logger.info("Background worker service stopped successfully");
	} catch (error) {
		logger.error(error, "Error stopping background worker service:");
		throw error;
	}
}

/**
 * Executes the materialization worker with robust error handling to prevent crashes.
 */
export async function runMaterializationWorkerSafely(
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<void> {
	const startTime = Date.now();
	logger.info("Starting materialization worker run");

	try {
		const result: WorkerResult = await runMaterializationWorker(
			materializationConfig,
			drizzleClient,
			logger,
		);

		const duration = Date.now() - startTime;
		logger.info(
			{
				duration: `${duration}ms`,
				organizationsProcessed: result.organizationsProcessed,
				instancesCreated: result.instancesCreated,
				windowsUpdated: result.windowsUpdated,
				errorsEncountered: result.errorsEncountered,
			},
			"Materialization worker completed successfully",
		);
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error(
			{
				duration: `${duration}ms`,
				error: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			},
			"Materialization worker failed",
		);
	}
}

/**
 * Executes the cleanup worker with robust error handling to ensure stability.
 */
export async function runCleanupWorkerSafely(
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<void> {
	const startTime = Date.now();
	logger.info("Starting cleanup worker run");

	try {
		const stats = await cleanupOldInstances(drizzleClient, logger);

		const duration = Date.now() - startTime;
		logger.info(
			{
				duration: `${duration}ms`,
				organizationsProcessed: stats.organizationsProcessed,
				instancesDeleted: stats.instancesDeleted,
				errorsEncountered: stats.errorsEncountered,
			},
			"Cleanup worker completed successfully",
		);
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error(
			{
				duration: `${duration}ms`,
				error: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			},
			"Cleanup worker failed",
		);
	}
}

/**
 * Manually triggers a run of the materialization worker, useful for testing or administrative purposes.
 * @throws {TalawaRestError} Thrown when the background worker service is not running.
 */
export async function triggerMaterializationWorker(
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<void> {
	if (!isRunning) {
		throw new TalawaRestError({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Background worker service is not running",
		});
	}

	logger.info("Manually triggering materialization worker");
	await runMaterializationWorkerSafely(drizzleClient, logger);
}

/**
 * Manually triggers a run of the cleanup worker, useful for testing or administrative purposes.
 * @throws {TalawaRestError} Thrown when the background worker service is not running.
 */
export async function triggerCleanupWorker(
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<void> {
	if (!isRunning) {
		throw new TalawaRestError({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Background worker service is not running",
		});
	}

	logger.info("Manually triggering cleanup worker");
	await runCleanupWorkerSafely(drizzleClient, logger);
}

/**
 * Retrieves the current status of the background worker service, including scheduling information.
 *
 * @returns - An object containing the current status of the service.
 */
export function getBackgroundWorkerStatus(): {
	isRunning: boolean;
	materializationSchedule: string;
	cleanupSchedule: string;
	nextMaterializationRun?: Date;
	nextCleanupRun?: Date;
} {
	return {
		isRunning,
		materializationSchedule:
			process.env.EVENT_GENERATION_CRON_SCHEDULE || "0 * * * *",
		cleanupSchedule: process.env.CLEANUP_CRON_SCHEDULE || "0 2 * * *",
	};
}

/**
 * Performs a health check of the background worker service, suitable for use by monitoring systems.
 *
 * @param logger - Optional logger for error reporting
 * @returns - A promise that resolves to an object indicating the health status and any relevant details.
 */
export async function healthCheck(logger?: FastifyBaseLogger): Promise<{
	status: "healthy" | "unhealthy";
	details: Record<string, unknown>;
}> {
	try {
		const status = getBackgroundWorkerStatus();

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
		if (logger) {
			logger.error({ err: error }, "Health check failed");
		}
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
 * Updates the configuration for the materialization worker at runtime.
 *
 * @param config - A partial configuration object with the new settings to apply.
 */
export function updateMaterializationConfig(
	config: Partial<WorkerConfig>,
	logger: FastifyBaseLogger,
): void {
	materializationConfig = {
		...materializationConfig,
		...config,
	};
	logger.info(config, "Updated materialization worker configuration");
}
