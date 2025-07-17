import {
	type MaterializeInstancesInput,
	materializeInstancesForRecurringEvent,
} from "~/src/services/eventInstanceMaterialization";
import type { ProcessingResult, WorkerDependencies } from "./types";

/**
 * @description Defines the structure of a materialization job, containing all necessary
 * information to process a single recurring event.
 */
export interface MaterializationJob {
	organizationId: string;
	baseRecurringEventId: string;
	windowStartDate: Date;
	windowEndDate: Date;
}

/**
 * @description Represents the result of a single materialization job execution,
 * including the number of instances created and the time taken.
 */
export interface MaterializationExecutionResult {
	organizationId: string;
	eventId: string;
	instancesCreated: number;
	executionTimeMs: number;
}

/**
 * Executes the materialization process for a single recurring event job.
 * This function is the core of the execution engine, handling the creation of event instances.
 *
 * @param job - The materialization job to execute.
 * @param deps - The dependencies required for the worker, such as the database client and logger.
 * @returns A promise that resolves to a processing result, including metrics and resource usage.
 */
export async function executeMaterialization(
	job: MaterializationJob,
	deps: WorkerDependencies,
): Promise<ProcessingResult<MaterializationExecutionResult>> {
	const startTime = Date.now();
	const { drizzleClient, logger } = deps;

	try {
		const input: MaterializeInstancesInput = {
			baseRecurringEventId: job.baseRecurringEventId,
			windowStartDate: job.windowStartDate,
			windowEndDate: job.windowEndDate,
			organizationId: job.organizationId,
		};

		const instancesCreated = await materializeInstancesForRecurringEvent(
			input,
			drizzleClient,
			logger,
		);

		const endTime = Date.now();
		const executionTime = endTime - startTime;

		return {
			success: true,
			data: {
				organizationId: job.organizationId,
				eventId: job.baseRecurringEventId,
				instancesCreated,
				executionTimeMs: executionTime,
			},
			metrics: {
				startTime,
				endTime,
				instancesCreated,
				eventsProcessed: 1,
				organizationsProcessed: 1,
				errorsEncountered: 0,
			},
			resourceUsage: {
				memoryUsageMB: 0, // Would need actual monitoring
				cpuUsagePercent: 0,
				databaseConnections: 1,
				processingThroughput: instancesCreated / (executionTime / 1000),
			},
		};
	} catch (error) {
		const endTime = Date.now();
		logger.error(
			`Materialization execution failed for ${job.organizationId}`,
			error,
		);

		return {
			success: false,
			data: null,
			error: String(error),
			metrics: {
				startTime,
				endTime,
				instancesCreated: 0,
				eventsProcessed: 0,
				organizationsProcessed: 0,
				errorsEncountered: 1,
			},
			resourceUsage: {
				memoryUsageMB: 0,
				cpuUsagePercent: 0,
				databaseConnections: 0,
				processingThroughput: 0,
			},
		};
	}
}

/**
 * Executes multiple materialization jobs in parallel, with a specified level of concurrency.
 * This function processes jobs in batches to control resource usage and improve throughput.
 *
 * @param jobs - An array of materialization jobs to execute.
 * @param maxConcurrency - The maximum number of jobs to run in parallel.
 * @param deps - The dependencies required for the worker.
 * @returns A promise that resolves to a consolidated processing result for the entire batch.
 */
export async function executeBatchMaterialization(
	jobs: MaterializationJob[],
	maxConcurrency: number,
	deps: WorkerDependencies,
): Promise<ProcessingResult<MaterializationExecutionResult[]>> {
	const startTime = Date.now();
	const results: MaterializationExecutionResult[] = [];
	const errors: string[] = [];

	// Process in batches to control concurrency
	for (let i = 0; i < jobs.length; i += maxConcurrency) {
		const batch = jobs.slice(i, i + maxConcurrency);
		const batchPromises = batch.map((job) => executeMaterialization(job, deps));

		const batchResults = await Promise.allSettled(batchPromises);

		for (const result of batchResults) {
			if (result.status === "fulfilled" && result.value.success) {
				if (result.value.data) {
					results.push(result.value.data);
				}
			} else {
				const error =
					result.status === "rejected"
						? String(result.reason)
						: result.value.error || "Unknown error";
				errors.push(error);
			}
		}
	}

	const endTime = Date.now();
	const totalInstancesCreated = results.reduce(
		(sum, r) => sum + r.instancesCreated,
		0,
	);

	return {
		success: errors.length === 0,
		data: results,
		error: errors.length > 0 ? errors.join("; ") : undefined,
		metrics: {
			startTime,
			endTime,
			instancesCreated: totalInstancesCreated,
			eventsProcessed: results.length,
			organizationsProcessed: new Set(results.map((r) => r.organizationId))
				.size,
			errorsEncountered: errors.length,
		},
		resourceUsage: {
			memoryUsageMB: 0,
			cpuUsagePercent: 0,
			databaseConnections: Math.min(maxConcurrency, jobs.length),
			processingThroughput:
				totalInstancesCreated / ((endTime - startTime) / 1000),
		},
	};
}
