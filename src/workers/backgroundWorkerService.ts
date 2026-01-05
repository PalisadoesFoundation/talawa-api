import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import cron from "node-cron";
import type * as schema from "~/src/drizzle/schema";
import { cleanupOldInstances } from "./eventCleanupWorker";
import {
	createDefaultWorkerConfig,
	runMaterializationWorker,
	type WorkerConfig,
	type WorkerResult,
} from "./eventGeneration/eventGenerationPipeline";
import { aggregatePerformanceMetrics } from "./performanceAggregationWorker";

let materializationTask: cron.ScheduledTask | undefined;
let cleanupTask: cron.ScheduledTask | undefined;
let perfAggregationTask: cron.ScheduledTask | undefined;
let isRunning = false;
let materializationConfig: WorkerConfig = createDefaultWorkerConfig();
// Store the actual schedules used when starting workers
let materializationSchedule: string | undefined;
let cleanupSchedule: string | undefined;
let perfAggregationSchedule: string | undefined;

/**
 * Initializes and starts all background workers, scheduling them to run at their configured intervals.
 */
export async function startBackgroundWorkers(
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
	fastify?: FastifyInstance,
): Promise<void> {
	if (isRunning) {
		logger.warn("Background workers are already running");
		return;
	}

	try {
		logger.info("Starting background worker service...");

		// Get schedules from fastify.envConfig if available, otherwise fall back to process.env
		const materializationScheduleValue =
			fastify?.envConfig.RECURRING_EVENT_GENERATION_CRON_SCHEDULE ??
			process.env.EVENT_GENERATION_CRON_SCHEDULE ??
			"0 * * * *";
		const cleanupScheduleValue =
			fastify?.envConfig.OLD_EVENT_INSTANCES_CLEANUP_CRON_SCHEDULE ??
			process.env.CLEANUP_CRON_SCHEDULE ??
			"0 2 * * *";
		const perfAggregationScheduleValue =
			fastify?.envConfig.PERF_AGGREGATION_CRON_SCHEDULE ??
			process.env.PERF_AGGREGATION_CRON_SCHEDULE ??
			"*/5 * * * *";

		// Store schedules for status reporting
		materializationSchedule = materializationScheduleValue;
		cleanupSchedule = cleanupScheduleValue;
		perfAggregationSchedule = perfAggregationScheduleValue;

		// Schedule event generation worker - runs every hour
		materializationTask = cron.schedule(
			materializationScheduleValue,
			() => runMaterializationWorkerSafely(drizzleClient, logger),
			{
				scheduled: false,
				timezone: "UTC",
			},
		);

		// Schedule cleanup worker - runs daily at 2 AM UTC
		cleanupTask = cron.schedule(
			cleanupScheduleValue,
			() => runCleanupWorkerSafely(drizzleClient, logger),
			{
				scheduled: false,
				timezone: "UTC",
			},
		);

		// Schedule performance aggregation worker - runs every 5 minutes
		if (fastify) {
			perfAggregationTask = cron.schedule(
				perfAggregationScheduleValue,
				() => runPerfAggregationWorkerSafely(fastify, logger),
				{
					scheduled: false,
					timezone: "UTC",
				},
			);
		}

		// Start the scheduled tasks
		materializationTask.start();
		cleanupTask.start();
		if (perfAggregationTask) {
			perfAggregationTask.start();
		}

		isRunning = true;
		logger.info(
			{
				materializationSchedule: materializationScheduleValue,
				cleanupSchedule: cleanupScheduleValue,
				perfAggregationSchedule: perfAggregationScheduleValue,
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

		if (perfAggregationTask) {
			perfAggregationTask.stop();
			perfAggregationTask = undefined;
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
 * Executes the performance aggregation worker with robust error handling.
 */
export async function runPerfAggregationWorkerSafely(
	fastify: FastifyInstance,
	logger: FastifyBaseLogger,
): Promise<void> {
	const startTime = Date.now();
	logger.info("Starting performance aggregation worker run");

	try {
		await aggregatePerformanceMetrics(fastify, logger);

		const duration = Date.now() - startTime;
		logger.info(
			{
				duration: `${duration}ms`,
			},
			"Performance aggregation worker completed successfully",
		);
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error(
			{
				duration: `${duration}ms`,
				error: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			},
			"Performance aggregation worker failed",
		);
	}
}

/**
 * Manually triggers a run of the materialization worker, useful for testing or administrative purposes.
 */
export async function triggerMaterializationWorker(
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<void> {
	if (!isRunning) {
		throw new Error("Background worker service is not running");
	}

	logger.info("Manually triggering materialization worker");
	await runMaterializationWorkerSafely(drizzleClient, logger);
}

/**
 * Manually triggers a run of the cleanup worker, useful for testing or administrative purposes.
 */
export async function triggerCleanupWorker(
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<void> {
	if (!isRunning) {
		throw new Error("Background worker service is not running");
	}

	logger.info("Manually triggering cleanup worker");
	await runCleanupWorkerSafely(drizzleClient, logger);
}

/**
 * Retrieves the current status of the background worker service, including scheduling information.
 *
 * @param schedules - Optional object containing the actual schedules used when starting workers.
 *                    If not provided, falls back to stored schedules or process.env for backward compatibility.
 * @returns - An object containing the current status of the service.
 */
export function getBackgroundWorkerStatus(schedules?: {
	materializationSchedule?: string;
	cleanupSchedule?: string;
	perfAggregationSchedule?: string;
}): {
	isRunning: boolean;
	materializationSchedule: string;
	cleanupSchedule: string;
	perfAggregationSchedule: string;
	nextMaterializationRun?: Date;
	nextCleanupRun?: Date;
} {
	// Use provided schedules, then stored schedules, then fall back to process.env for backward compatibility
	return {
		isRunning,
		materializationSchedule:
			schedules?.materializationSchedule ??
			materializationSchedule ??
			process.env.EVENT_GENERATION_CRON_SCHEDULE ??
			"0 * * * *",
		cleanupSchedule:
			schedules?.cleanupSchedule ??
			cleanupSchedule ??
			process.env.CLEANUP_CRON_SCHEDULE ??
			"0 2 * * *",
		perfAggregationSchedule:
			schedules?.perfAggregationSchedule ??
			perfAggregationSchedule ??
			process.env.PERF_AGGREGATION_CRON_SCHEDULE ??
			"*/5 * * * *",
	};
}

/**
 * Performs a health check of the background worker service, suitable for use by monitoring systems.
 *
 * @param schedules - Optional object containing the actual schedules used when starting workers.
 *                    If not provided, falls back to stored schedules or process.env for backward compatibility.
 * @returns - A promise that resolves to an object indicating the health status and any relevant details.
 */
export async function healthCheck(schedules?: {
	materializationSchedule?: string;
	cleanupSchedule?: string;
	perfAggregationSchedule?: string;
}): Promise<{
	status: "healthy" | "unhealthy";
	details: Record<string, unknown>;
}> {
	try {
		const status = getBackgroundWorkerStatus(schedules);

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
