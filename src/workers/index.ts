/**
 * Background workers for event materialization system.
 *
 * This module provides:
 * - BackgroundWorkerService: Main orchestrator for all workers
 * - EventCleanupWorker: Removes old instances
 * - Functional worker modules: Direct access to functional components
 */

export {
	BackgroundWorkerService,
	initializeBackgroundWorkerService,
	getBackgroundWorkerService,
} from "./backgroundWorkerService";

export { EventCleanupWorker } from "./eventCleanupWorker";

// Functional worker API - imported directly from modules
export {
	runMaterializationWorker,
	runSingleOrganizationWorker,
	createDefaultWorkerConfig,
	type WorkerConfig,
	type WorkerResult,
} from "./eventMaterialization/materializationPipeline";

export {
	executeMaterialization,
	executeBatchMaterialization,
	type MaterializationJob,
	type MaterializationExecutionResult,
} from "./eventMaterialization/executionEngine";

export {
	discoverMaterializationWorkloads,
	createMaterializationJobs,
	createDefaultJobDiscoveryConfig,
	type DiscoveredWorkload,
	type JobDiscoveryConfig,
} from "./eventMaterialization/jobDiscovery";

export {
	getOrganizationsNeedingMaterialization,
	updateWindowAfterProcessing,
	getOrganizationMaterializationStatus,
	type WindowProcessingConfig,
	type WindowProcessingResult,
} from "./eventMaterialization/windowManager";

export {
	executePostProcessing,
	createDefaultPostProcessingConfig,
	type PostProcessingConfig,
	type PostProcessingResult,
} from "./eventMaterialization/postProcessor";

export type {
	WorkerDependencies,
	ProcessingMetrics,
	ResourceUsage,
	ProcessingResult,
} from "./eventMaterialization/types";
