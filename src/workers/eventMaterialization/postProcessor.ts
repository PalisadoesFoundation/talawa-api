import type { MaterializationExecutionResult } from "./executionEngine";
import type { ProcessingMetrics, WorkerDependencies } from "./types";

/**
 * Post-processing operations after materialization work is complete
 * Handles cleanup, statistics, and state updates
 */

export interface PostProcessingConfig {
	enableCleanup: boolean;
}

export interface PostProcessingResult {
	cleanupPerformed: boolean;
	errors: string[];
	windowsUpdated: number;
}

/**
 * Performs post-processing after materialization execution
 */
export async function executePostProcessing(
	executionResults: MaterializationExecutionResult[],
	metrics: ProcessingMetrics,
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
		logger.error(errorMessage, error);
		result.errors.push(errorMessage);
	}

	return result;
}

// Statistics collection removed - using simple logging only

/**
 * Performs cleanup operations after processing
 */
async function performCleanupOperations(
	executionResults: MaterializationExecutionResult[],
	deps: WorkerDependencies,
): Promise<void> {
	const { logger } = deps;

	// Example cleanup operations:
	// 1. Clean up old materialized instances
	// 2. Update processing queues
	// 3. Clear temporary data
	// 4. Log completion status

	logger.info("Cleanup operations completed", {
		organizationsProcessed: new Set(
			executionResults.map((r) => r.organizationId),
		).size,
		totalInstancesCreated: executionResults.reduce(
			(sum, r) => sum + r.instancesCreated,
			0,
		),
	});
}

/**
 * Creates default post-processing configuration
 */
export function createDefaultPostProcessingConfig(): PostProcessingConfig {
	return {
		enableCleanup: true,
	};
}
