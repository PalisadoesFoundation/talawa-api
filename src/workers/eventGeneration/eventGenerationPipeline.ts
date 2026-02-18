import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import type * as schema from "~/src/drizzle/schema";

import { executeBatchEventGeneration } from "./executionEngine";
// Import focused modules
import {
	createDefaultJobDiscoveryConfig,
	createEventGenerationJobs,
	discoverEventGenerationWorkloads,
} from "./jobDiscovery";
import {
	createDefaultPostProcessingConfig,
	executePostProcessing,
} from "./postProcessor";
import type { WorkerDependencies } from "./types";

/**
 * Configuration for the materialization worker, specifying concurrency and processing limits.
 */
export interface WorkerConfig {
	maxConcurrentJobs: number;
	maxOrganizations: number;
	enablePostProcessing: boolean;
}

/**
 * Represents the result of a materialization worker run, summarizing the work done.
 */
export interface WorkerResult {
	organizationsProcessed: number;
	instancesCreated: number;
	windowsUpdated: number;
	errorsEncountered: number;
	processingTimeMs: number;
}

/**
 * The main function for the materialization worker, orchestrating the entire pipeline
 * from job discovery to execution and post-processing.
 *
 * @param config - The configuration for the worker.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging the worker's progress and any errors.
 * @returns - A promise that resolves to a summary result of the worker's run.
 */
export async function runMaterializationWorker(
	config: WorkerConfig,
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<WorkerResult> {
	const startTime = Date.now();
	const deps: WorkerDependencies = { drizzleClient, logger };

	logger.info(
		{
			maxConcurrentJobs: config.maxConcurrentJobs,
			maxOrganizations: config.maxOrganizations,
		},
		"Starting materialization worker run",
	);

	try {
		// Step 1: Discover work to be done
		const workloads = await discoverEventGenerationWorkloads(
			{
				...createDefaultJobDiscoveryConfig(),
				maxOrganizations: config.maxOrganizations,
			},
			deps,
		);

		if (workloads.length === 0) {
			logger.info("No materialization work discovered");
			return createEmptyResult(startTime);
		}

		// Step 2: Create executable jobs
		const jobs = createEventGenerationJobs(workloads);

		logger.info(
			`Created ${jobs.length} materialization jobs from ${workloads.length} workloads`,
		);

		// Step 3: Execute jobs
		const executionResult = await executeBatchEventGeneration(
			jobs,
			config.maxConcurrentJobs,
			deps,
		);

		if (!executionResult.success) {
			logger.error({ error: executionResult.error }, "Batch execution failed");
		}

		// Step 4: Post-processing (optional)
		let windowsUpdated = 0;
		if (config.enablePostProcessing && executionResult.data) {
			const postProcessResult = await executePostProcessing(
				executionResult.data,
				executionResult.metrics,
				createDefaultPostProcessingConfig(),
				deps,
			);
			windowsUpdated = postProcessResult.windowsUpdated;
		}

		const endTime = Date.now();
		const result: WorkerResult = {
			organizationsProcessed: executionResult.metrics.organizationsProcessed,
			instancesCreated: executionResult.metrics.instancesCreated,
			windowsUpdated,
			errorsEncountered: executionResult.metrics.errorsEncountered,
			processingTimeMs: endTime - startTime,
		};

		logger.info(result, "Materialization worker completed");
		return result;
	} catch (error) {
		logger.error({ error }, "Materialization worker failed");
		return {
			organizationsProcessed: 0,
			instancesCreated: 0,
			windowsUpdated: 0,
			errorsEncountered: 1,
			processingTimeMs: Date.now() - startTime,
		};
	}
}

/**
 * Manually triggers the materialization process for a single, specific organization.
 *
 * @param organizationId - The ID of the organization to process.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging the process.
 * @returns - A promise that resolves to the result of the processing for the specified organization.
 */
export async function runSingleOrganizationWorker(
	organizationId: string,
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<WorkerResult> {
	const startTime = Date.now();
	const deps: WorkerDependencies = { drizzleClient, logger };

	logger.info(`Processing specific organization: ${organizationId}`);

	try {
		// Discover work for this specific organization
		const allWorkloads = await discoverEventGenerationWorkloads(
			createDefaultJobDiscoveryConfig(),
			deps,
		);

		const orgWorkloads = allWorkloads.filter(
			(w) => w.organizationId === organizationId,
		);

		if (orgWorkloads.length === 0) {
			logger.warn(`No work found for organization ${organizationId}`);
			return createEmptyResult(startTime);
		}

		// Create and execute jobs for this organization
		const jobs = createEventGenerationJobs(orgWorkloads);

		const executionResult = await executeBatchEventGeneration(jobs, 5, deps);

		// Post-processing
		let windowsUpdated = 0;
		if (executionResult.data) {
			const postProcessResult = await executePostProcessing(
				executionResult.data,
				executionResult.metrics,
				createDefaultPostProcessingConfig(),
				deps,
			);
			windowsUpdated = postProcessResult.windowsUpdated;
		}

		const result: WorkerResult = {
			organizationsProcessed: 1,
			instancesCreated: executionResult.metrics.instancesCreated,
			windowsUpdated,
			errorsEncountered: executionResult.metrics.errorsEncountered,
			processingTimeMs: Date.now() - startTime,
		};

		logger.info(
			result,
			`Completed processing for organization ${organizationId}`,
		);
		return result;
	} catch (error) {
		logger.error(error, `Failed to process organization ${organizationId}`);
		return {
			organizationsProcessed: 0,
			instancesCreated: 0,
			windowsUpdated: 0,
			errorsEncountered: 1,
			processingTimeMs: Date.now() - startTime,
		};
	}
}

/**
 * Creates an empty worker result object, used when no materialization work is found.
 *
 * @param startTime - The start time of the worker run, used to calculate processing time.
 * @returns - An empty worker result object.
 */
function createEmptyResult(startTime: number): WorkerResult {
	return {
		organizationsProcessed: 0,
		instancesCreated: 0,
		windowsUpdated: 0,
		errorsEncountered: 0,
		processingTimeMs: Date.now() - startTime,
	};
}

/**
 * Creates a default configuration object for the materialization worker.
 *
 * @returns - A default worker configuration.
 */
export function createDefaultWorkerConfig(): WorkerConfig {
	return {
		maxConcurrentJobs: 5,
		maxOrganizations: 50,
		enablePostProcessing: true,
	};
}
