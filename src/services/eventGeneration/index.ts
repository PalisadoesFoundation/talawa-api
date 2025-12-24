/**
 * Event Instance Materialization Service
 *
 * A modular service for managing materialized event instances.
 * This service handles creating materialized instances from recurring event templates
 * and maintaining the hot window of pre-calculated instances.
 *
 */

// Main service functions (business logic only)
// Convenience re-exports for backward compatibility
export {
	calculateInstanceOccurrences as calculateOccurrences,
	cleanupOldGeneratedInstances as cleanupOldInstances,
	generateInstancesForRecurringEvent,
	initializeGenerationWindow as initializeWindow,
	resolveInstanceWithInheritance as resolveInstance,
} from "./eventGeneration";
// Instance resolution functions
export {
	createExceptionLookupMap,
	createTemplateLookupMap,
	resolveInstanceWithInheritance,
	resolveMultipleInstances,
	validateResolvedInstance,
} from "./instanceResolver";
// Occurrence calculation functions
export {
	calculateInstanceOccurrences,
	getNextOccurrenceDate,
	shouldGenerateInstanceAtDate,
	validateRecurrenceRule,
} from "./occurrenceCalculator";

// Types
export type {
	CalculatedOccurrence,
	GenerateInstancesInput,
	GetGeneratedInstancesInput,
	OccurrenceCalculationConfig,
	RecurrenceContext,
	ResolveInstanceInput,
	ServiceDependencies,
	WindowManagerConfig,
} from "./types";
// Window management functions
export {
	cleanupOldGeneratedInstances,
	extendGenerationWindow,
	getCleanupStats,
	initializeGenerationWindow,
	validateWindowConfig,
} from "./windowManager";
