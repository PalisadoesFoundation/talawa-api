/**
 * Event Instance Materialization Service
 *
 * A modular service for managing materialized event instances.
 * This service handles creating materialized instances from recurring event templates
 * and maintaining the hot window of pre-calculated instances.
 *
 */

// Main service functions (business logic only)
export { generateInstancesForRecurringEvent } from "./eventGeneration";

// Instance resolution functions
export {
	resolveInstanceWithInheritance,
	resolveMultipleInstances,
	createExceptionLookupMap,
	createTemplateLookupMap,
	validateResolvedInstance,
} from "./instanceResolver";

// Occurrence calculation functions
export {
	calculateInstanceOccurrences,
	shouldGenerateInstanceAtDate,
	getNextOccurrenceDate,
	validateRecurrenceRule,
} from "./occurrenceCalculator";

// Window management functions
export {
	initializeGenerationWindow,
	extendGenerationWindow,
	cleanupOldGeneratedInstances,
	getCleanupStats,
	validateWindowConfig,
} from "./windowManager";

// Types
export type {
	GetGeneratedInstancesInput,
	GenerateInstancesInput,
	OccurrenceCalculationConfig,
	CalculatedOccurrence,
	ResolveInstanceInput,
	WindowManagerConfig,
	ServiceDependencies,
	RecurrenceContext,
} from "./types";

// Convenience re-exports for backward compatibility
export {
	initializeGenerationWindow as initializeWindow,
	cleanupOldGeneratedInstances as cleanupOldInstances,
	calculateInstanceOccurrences as calculateOccurrences,
	resolveInstanceWithInheritance as resolveInstance,
} from "./eventGeneration";
