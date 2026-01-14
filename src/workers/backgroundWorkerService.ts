import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import cron from "node-cron";
import type * as schema from "~/src/drizzle/schema";
import type { PerfSnapshot } from "~/src/utilities/metrics/performanceTracker";
import { cleanupOldInstances } from "./eventCleanupWorker";
import {
	createDefaultWorkerConfig,
	runMaterializationWorker,
	type WorkerConfig,
	type WorkerResult,
} from "./eventGeneration/eventGenerationPipeline";
import { runMetricsAggregationWorker } from "./metrics/metricsAggregationWorker";

let materializationTask: cron.ScheduledTask | undefined;
let cleanupTask: cron.ScheduledTask | undefined;
let metricsTask: cron.ScheduledTask | undefined;
let isRunning = false;
let materializationConfig: WorkerConfig = createDefaultWorkerConfig();
// Store metrics configuration at startup for status reporting
let metricsEnabled: boolean | undefined;
let metricsSchedule: string | undefined;

/**
 * Initializes and starts all background workers, scheduling them to run at their configured intervals.
 *
 * @param drizzleClient - Drizzle database client
 * @param logger - Fastify logger instance
 * @param getMetricsSnapshots - Optional function to retrieve performance snapshots for metrics aggregation
 */
export async function startBackgroundWorkers(
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
	getMetricsSnapshots?: (windowMinutes?: number) => PerfSnapshot[],
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

		// Schedule metrics aggregation worker if enabled and snapshot getter is provided
		// Parse API_METRICS_AGGREGATION_ENABLED explicitly (case-insensitive)
		// Default to true (enabled) when unset, matching envConfigSchema default
		const enabledValue = process.env.API_METRICS_AGGREGATION_ENABLED;
		if (enabledValue === undefined || enabledValue === "") {
			metricsEnabled = true; // Default to enabled when unset
		} else {
			metricsEnabled = ["true", "1", "yes"].includes(
				enabledValue.toLowerCase(),
			);
		}
		metricsSchedule =
			process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE || "*/5 * * * *";

		const rawWindowMinutes = Number(
			process.env.API_METRICS_AGGREGATION_WINDOW_MINUTES ?? 5,
		);
		const metricsWindowMinutes =
			Number.isFinite(rawWindowMinutes) && rawWindowMinutes > 0
				? Math.floor(rawWindowMinutes)
				: 5;

		if (metricsEnabled && getMetricsSnapshots) {
			metricsTask = cron.schedule(
				metricsSchedule,
				() =>
					runMetricsAggregationWorkerSafely(
						getMetricsSnapshots,
						metricsWindowMinutes,
						logger,
					),
				{
					scheduled: false,
					timezone: "UTC",
				},
			);

			metricsTask.start();
			logger.info(
				{
					metricsSchedule,
					metricsWindowMinutes,
				},
				"Metrics aggregation worker scheduled",
			);
		} else if (metricsEnabled && !getMetricsSnapshots) {
			logger.warn(
				"Metrics aggregation is enabled but snapshot getter is not available. Metrics worker will not start.",
			);
		}

		isRunning = true;
		logger.info(
			{
				materializationSchedule:
					process.env.EVENT_GENERATION_CRON_SCHEDULE || "0 * * * *",
				cleanupSchedule: process.env.CLEANUP_CRON_SCHEDULE || "0 2 * * *",
				metricsEnabled: metricsEnabled && !!getMetricsSnapshots,
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
 * Executes the metrics aggregation worker with robust error handling to prevent crashes.
 */
export async function runMetricsAggregationWorkerSafely(
	getMetricsSnapshots: (windowMinutes?: number) => PerfSnapshot[],
	windowMinutes: number,
	logger: FastifyBaseLogger,
): Promise<void> {
	const startTime = Date.now();
	logger.info("Starting metrics aggregation worker run");

	try {
		await runMetricsAggregationWorker(
			getMetricsSnapshots,
			windowMinutes,
			logger,
		);

		const duration = Date.now() - startTime;
		logger.info(
			{
				duration: `${duration}ms`,
			},
			"Metrics aggregation worker completed successfully",
		);
	} catch (error) {
		const duration = Date.now() - startTime;
		logger.error(
			{
				duration: `${duration}ms`,
				error: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			},
			"Metrics aggregation worker failed",
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
 * @returns - An object containing the current status of the service.
 */
export function getBackgroundWorkerStatus(): {
	isRunning: boolean;
	materializationSchedule: string;
	cleanupSchedule: string;
	metricsSchedule?: string;
	metricsEnabled?: boolean;
	nextMaterializationRun?: Date;
	nextCleanupRun?: Date;
} {
	// Read metrics configuration directly from env vars for accurate status reporting
	// This ensures tests and status checks always reflect current configuration
	const enabledValue = process.env.API_METRICS_AGGREGATION_ENABLED;

	// Parse metrics enabled: only true if explicitly set to truthy value
	let currentMetricsEnabled: boolean;
	if (enabledValue === undefined || enabledValue === "") {
		currentMetricsEnabled = false; // Not explicitly configured, treat as disabled for status
	} else {
		currentMetricsEnabled = ["true", "1", "yes"].includes(
			enabledValue.toLowerCase(),
		);
	}

	const currentMetricsSchedule =
		process.env.API_METRICS_AGGREGATION_CRON_SCHEDULE || "*/5 * * * *";

	return {
		isRunning,
		materializationSchedule:
			process.env.EVENT_GENERATION_CRON_SCHEDULE || "0 * * * *",
		cleanupSchedule: process.env.CLEANUP_CRON_SCHEDULE || "0 2 * * *",
		// Only include metrics fields when explicitly enabled
		...(currentMetricsEnabled && {
			metricsSchedule: currentMetricsSchedule,
			metricsEnabled: currentMetricsEnabled,
		}),
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
