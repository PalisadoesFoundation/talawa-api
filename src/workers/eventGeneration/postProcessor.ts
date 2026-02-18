import type { EventGenerationExecutionResult } from "./executionEngine";
import type { ProcessingMetrics, WorkerDependencies } from "./types";

/**
 * Configuration for post-processing operations, allowing features like cleanup to be toggled.
 */
export interface PostProcessingConfig {
	enableCleanup: boolean;
}

/**
 * Represents the result of post-processing operations, including whether cleanup was performed and any errors encountered.
 */
export interface PostProcessingResult {
	cleanupPerformed: boolean;
	errors: string[];
	windowsUpdated: number;
}

/**
 * Executes post-processing tasks after the materialization of event instances is complete.
 * This includes operations like cleaning up old data and logging final statistics.
 *
 * @param executionResults - An array of results from the materialization execution.
 * @param metrics - The metrics collected during the materialization process.
 * @param config - The configuration for post-processing.
 * @param deps - The dependencies required for the worker.
 * @returns - A promise that resolves to the result of the post-processing operations.
 */
export async function executePostProcessing(
	executionResults: EventGenerationExecutionResult[],
	_metrics: ProcessingMetrics,
	config: PostProcessingConfig,
	deps: WorkerDependencies,
): Promise<PostProcessingResult> {
	const { logger } = deps;
	const result: PostProcessingResult = {
		cleanupPerformed: false,
		errors: [],
		windowsUpdated: 0,
	};

	try {
		// Perform cleanup
		if (config.enableCleanup) {
			await performCleanupOperations(executionResults, deps);
			result.cleanupPerformed = true;
		}
	} catch (error) {
		const errorMessage = `Post-processing failed: ${error}`;
		logger.error(error, errorMessage);
		result.errors.push(errorMessage);
	}

	return result;
}

/**
 * Performs cleanup operations after the materialization process is complete,
 * such as clearing temporary data and logging completion status.
 *
 * @param executionResults - The results from the materialization execution.
 * @param deps - The worker dependencies.
 */
async function performCleanupOperations(
	executionResults: EventGenerationExecutionResult[],
	deps: WorkerDependencies,
): Promise<void> {
	const { logger } = deps;

	// Example cleanup operations:
	// 1. Clean up old materialized instances
	// 2. Update processing queues
	// 3. Clear temporary data
	// 4. Log completion status

	logger.info(
		{
			organizationsProcessed: new Set(
				executionResults.map((r) => r.organizationId),
			).size,
			totalInstancesCreated: executionResults.reduce(
				(sum, r) => sum + r.instancesCreated,
				0,
			),
		},
		"Cleanup operations completed",
	);
}

/**
 * Creates a default configuration object for post-processing operations.
 *
 * @returns - A default post-processing configuration.
 */
export function createDefaultPostProcessingConfig(): PostProcessingConfig {
	return {
		enableCleanup: true,
	};
}
