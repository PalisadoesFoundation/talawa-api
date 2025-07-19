/**
 * Background workers for event materialization system.
 *
 * This module provides:
 * - BackgroundWorkerService: Main orchestrator for all workers
 * - EventCleanupWorker: Removes old instances
 * - Functional worker modules: Direct access to functional components
 */

export * from "./backgroundWorkerService";
export * from "./eventCleanupWorker";

// Functional worker API - imported directly from modules
export {
	runMaterializationWorker,
	runSingleOrganizationWorker,
	createDefaultWorkerConfig,
	type WorkerConfig,
	type WorkerResult,
} from "./eventGeneration/materializationPipeline";

export {
	executeEventGeneration,
	executeBatchEventGeneration,
	type EventGenerationJob,
	type EventGenerationExecutionResult,
} from "./eventGeneration/executionEngine";

export {
	discoverEventGenerationWorkloads,
	createEventGenerationJobs,
	createDefaultJobDiscoveryConfig,
	type DiscoveredWorkload,
	type JobDiscoveryConfig,
} from "./eventGeneration/jobDiscovery";

export {
	initializeGenerationWindow,
	extendGenerationWindow,
	cleanupOldGeneratedInstances,
	getCleanupStats,
	validateWindowConfig,
} from "../services/eventGeneration/windowManager";

export {
	executePostProcessing,
	createDefaultPostProcessingConfig,
	type PostProcessingConfig,
	type PostProcessingResult,
} from "./eventGeneration/postProcessor";

export type {
	WorkerDependencies,
	ProcessingMetrics,
	ResourceUsage,
	ProcessingResult,
} from "./eventGeneration/types";
