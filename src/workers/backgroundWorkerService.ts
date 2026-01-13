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
import { runMetricsAggregationWorker } from "./metrics/metricsAggregationWorker";
import type {
	MetricsAggregationOptions,
	MetricsAggregationResult,
} from "./metrics/types";

let materializationTask: cron.ScheduledTask | undefined;
let cleanupTask: cron.ScheduledTask | undefined;
let metricsTask: cron.ScheduledTask | undefined;
let isRunning = false;
let materializationConfig: WorkerConfig = createDefaultWorkerConfig();
let fastifyInstance: FastifyInstance | undefined;

/**
 * Computes the metrics aggregation schedule string.
 * Returns the configured cron schedule if metrics are enabled and Fastify instance is available,
 * otherwise returns "disabled".
 *
 * @param fastify - Optional Fastify instance to check for metrics configuration. If not provided, uses the module-level fastifyInstance.
 * @returns The cron schedule string or "disabled"
 */
function getMetricsSchedule(fastify?: FastifyInstance): string {
	const instance = fastify ?? fastifyInstance;
	const metricsEnabled =
		instance?.envConfig.METRICS_AGGREGATION_ENABLED ?? true;

	if (metricsEnabled && instance) {
		return (
			instance.envConfig.METRICS_AGGREGATION_CRON_SCHEDULE ?? "*/5 * * * *"
		);
	}

	return "disabled";
}

/**
 * Initializes and starts all background workers, scheduling them to run at their configured intervals.
 *
 * @param drizzleClient - Database client for database operations
 * @param logger - Logger instance for logging
 * @param fastify - Optional Fastify instance for accessing performance snapshots
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

		// Store Fastify instance for metrics aggregation worker
		fastifyInstance = fastify;

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

		// Schedule metrics aggregation worker if enabled
		const metricsSchedule = getMetricsSchedule(fastify);
		if (metricsSchedule !== "disabled") {
			metricsTask = cron.schedule(
				metricsSchedule,
				() => runMetricsAggregationWorkerSafely(logger),
				{
					scheduled: false,
					timezone: "UTC",
				},
			);
			metricsTask.start();
		} else if (
			(fastify?.envConfig.METRICS_AGGREGATION_ENABLED ?? true) &&
			!fastify
		) {
			logger.warn(
				"Metrics aggregation is enabled but Fastify instance is not available. Metrics worker will not start.",
			);
		}

		// Start the scheduled tasks
		materializationTask.start();
		cleanupTask.start();

		isRunning = true;
		logger.info(
			{
				materializationSchedule:
					process.env.EVENT_GENERATION_CRON_SCHEDULE || "0 * * * *",
				cleanupSchedule: process.env.CLEANUP_CRON_SCHEDULE || "0 2 * * *",
				metricsSchedule: getMetricsSchedule(fastify),
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

		if (metricsTask) {
			metricsTask.stop();
			metricsTask = undefined;
		}

		fastifyInstance = undefined;
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
 * Manually triggers a run of the metrics aggregation worker, useful for testing or administrative purposes.
 */
export async function triggerMetricsAggregationWorker(
	logger: FastifyBaseLogger,
): Promise<void> {
	if (!isRunning) {
		throw new Error("Background worker service is not running");
	}

	if (!fastifyInstance) {
		throw new Error(
			"Fastify instance is not available for metrics aggregation",
		);
	}

	logger.info("Manually triggering metrics aggregation worker");
	await runMetricsAggregationWorkerSafely(logger);
}

/**
 * Executes the metrics aggregation worker with robust error handling to prevent crashes.
 */
export async function runMetricsAggregationWorkerSafely(
	logger: FastifyBaseLogger,
): Promise<void> {
	const fastify = fastifyInstance;
	if (!fastify) {
		logger.warn(
			"Metrics aggregation worker cannot run: Fastify instance not available",
		);
		return;
	}

	const startTime = Date.now();
	logger.info("Starting metrics aggregation worker run");

	let result: MetricsAggregationResult | undefined;

	try {
		// Get configuration from validated environment config
		// Values are already validated and typed by the schema
		const options: MetricsAggregationOptions = {
			windowMinutes: fastify.envConfig.METRICS_AGGREGATION_WINDOW_MINUTES ?? 5,
			maxSnapshots: fastify.envConfig.METRICS_SNAPSHOT_RETENTION_COUNT ?? 1000,
			slowThresholdMs: fastify.envConfig.METRICS_SLOW_THRESHOLD_MS ?? 200,
		};

		result = runMetricsAggregationWorker(
			() => fastify.getPerformanceSnapshots(),
			logger,
			options,
		);

		const duration = Date.now() - startTime;

		// Check if aggregation failed (error field present)
		if (result?.error) {
			logger.error(
				{
					duration: `${duration}ms`,
					snapshotsProcessed: result.snapshotsProcessed ?? 0,
					aggregationDuration:
						result.aggregationDurationMs !== undefined
							? `${result.aggregationDurationMs}ms`
							: `${duration}ms`,
					error:
						result.error instanceof Error
							? result.error.message
							: String(result.error),
					stack: result.error instanceof Error ? result.error.stack : undefined,
				},
				"Metrics aggregation worker failed",
			);
			return;
		}

		// If result is undefined, this shouldn't happen but handle it defensively
		if (!result) {
			logger.error(
				{
					duration: `${duration}ms`,
					error: "Metrics aggregation worker returned undefined result",
				},
				"Metrics aggregation worker failed",
			);
			return;
		}

		logger.info(
			{
				duration: `${duration}ms`,
				snapshotsProcessed: result.snapshotsProcessed,
				aggregationDuration: `${result.aggregationDurationMs}ms`,
				operationsCount: Object.keys(result.metrics.operations).length,
				cacheHitRate: result.metrics.cache.hitRate,
				slowOperations: result.metrics.slowOperationCount,
				avgTotalMs: result.metrics.avgTotalMs,
				p95TotalMs: result.metrics.p95TotalMs,
				p99TotalMs: result.metrics.p99TotalMs,
			},
			"Metrics aggregation worker completed successfully",
		);
	} catch (error) {
		// This catch block handles exceptions thrown BEFORE result is assigned
		// or any other unexpected errors
		const duration = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;

		logger.error(
			{
				duration: `${duration}ms`,
				snapshotsProcessed: result?.snapshotsProcessed ?? 0,
				aggregationDuration:
					result?.aggregationDurationMs !== undefined
						? `${result.aggregationDurationMs}ms`
						: `${duration}ms`,
				error: errorMessage,
				stack: errorStack,
			},
			"Metrics aggregation worker failed",
		);
	}
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
	metricsSchedule: string;
	nextMaterializationRun?: Date;
	nextCleanupRun?: Date;
} {
	return {
		isRunning,
		materializationSchedule:
			process.env.EVENT_GENERATION_CRON_SCHEDULE || "0 * * * *",
		cleanupSchedule: process.env.CLEANUP_CRON_SCHEDULE || "0 2 * * *",
		metricsSchedule: getMetricsSchedule(),
	};
}

/**
 * Performs a health check of the background worker service, suitable for use by monitoring systems.
 *
 * @returns - A promise that resolves to an object indicating the health status and any relevant details.
 */
export async function healthCheck(): Promise<{
	status: "healthy" | "unhealthy";
	details: Record<string, unknown>;
}> {
	try {
		const status = getBackgroundWorkerStatus();

		// Check if workers are running
		if (!status.isRunning) {
			return {
				status: "unhealthy",
				details: {
					reason: "Background workers not running",
					isRunning: status.isRunning,
					materializationSchedule: status.materializationSchedule,
					cleanupSchedule: status.cleanupSchedule,
					metricsSchedule: status.metricsSchedule,
					nextMaterializationRun: status.nextMaterializationRun,
					nextCleanupRun: status.nextCleanupRun,
				},
			};
		}

		// Workers are running and status check succeeded
		return {
			status: "healthy",
			details: {
				isRunning: status.isRunning,
				materializationSchedule: status.materializationSchedule,
				cleanupSchedule: status.cleanupSchedule,
				metricsSchedule: status.metricsSchedule,
				nextMaterializationRun: status.nextMaterializationRun,
				nextCleanupRun: status.nextCleanupRun,
			},
		};
	} catch (error) {
		// Return unhealthy status when getBackgroundWorkerStatus throws
		return {
			status: "unhealthy",
			details: {
				reason: "Health check failed",
				error: error instanceof Error ? error.message : String(error),
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
