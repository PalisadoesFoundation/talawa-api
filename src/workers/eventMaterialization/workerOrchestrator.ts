import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import type * as schema from "~/src/drizzle/schema";

import { executeBatchMaterialization } from "./executionEngine";
// Import focused modules
import {
	createDefaultJobDiscoveryConfig,
	createMaterializationJobs,
	discoverMaterializationWorkloads,
} from "./jobDiscovery";
import {
	createDefaultPostProcessingConfig,
	executePostProcessing,
} from "./postProcessor";
import type { WorkerDependencies } from "./types";

/**
 * Simple worker configuration
 */
export interface WorkerConfig {
	maxConcurrentJobs: number;
	maxOrganizations: number;
	enablePostProcessing: boolean;
}

/**
 * Simplified worker result
 */
export interface WorkerResult {
	organizationsProcessed: number;
	instancesCreated: number;
	windowsUpdated: number;
	errorsEncountered: number;
	processingTimeMs: number;
}

/**
 * Main materialization worker function - simplified and focused
 */
export async function runMaterializationWorker(
	config: WorkerConfig,
	drizzleClient: NodePgDatabase<typeof schema>,
	logger: FastifyBaseLogger,
): Promise<WorkerResult> {
	const startTime = Date.now();
	const deps: WorkerDependencies = { drizzleClient, logger };

	logger.info("Starting materialization worker", {
		maxConcurrentJobs: config.maxConcurrentJobs,
		maxOrganizations: config.maxOrganizations,
	});

	try {
		// Step 1: Discover work to be done
		const workloads = await discoverMaterializationWorkloads(
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
		const jobs = createMaterializationJobs(workloads);

		logger.info(
			`Created ${jobs.length} materialization jobs from ${workloads.length} workloads`,
		);

		// Step 3: Execute jobs
		const executionResult = await executeBatchMaterialization(
			jobs,
			config.maxConcurrentJobs,
			deps,
		);

		if (!executionResult.success) {
			logger.error("Batch execution failed", { error: executionResult.error });
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

		logger.info("Materialization worker completed", result);
		return result;
	} catch (error) {
		logger.error("Materialization worker failed", error);
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
 * Processes a specific organization manually
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
		const allWorkloads = await discoverMaterializationWorkloads(
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
		const jobs = createMaterializationJobs(orgWorkloads);

		const executionResult = await executeBatchMaterialization(jobs, 5, deps);

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
			`Completed processing for organization ${organizationId}`,
			result,
		);
		return result;
	} catch (error) {
		logger.error(`Failed to process organization ${organizationId}`, error);
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
 * Creates an empty result for when no work is found
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
 * Creates default worker configuration
 */
export function createDefaultWorkerConfig(): WorkerConfig {
	return {
		maxConcurrentJobs: 5,
		maxOrganizations: 50,
		enablePostProcessing: true,
	};
}
