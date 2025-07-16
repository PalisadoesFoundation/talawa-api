/**
 * Event Instance Materialization Service
 *
 * A modular service for managing materialized event instances.
 * This service handles creating materialized instances from recurring event templates
 * and maintaining the hot window of pre-calculated instances.
 *
 * Query functions have been moved to ~/src/graphql/types/Query/eventQueries/
 */

// Main service functions (business logic only)
export { materializeInstancesForRecurringEvent } from "./eventMaterialization";

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
	initializeMaterializationWindow,
	extendMaterializationWindow,
	cleanupOldMaterializedInstances,
	getCleanupStats,
	validateWindowConfig,
} from "./windowManager";

// Types
export type {
	GetMaterializedInstancesInput,
	MaterializeInstancesInput,
	OccurrenceCalculationConfig,
	CalculatedOccurrence,
	ResolveInstanceInput,
	WindowManagerConfig,
	ServiceDependencies,
	RecurrenceContext,
} from "./types";

// Convenience re-exports for backward compatibility
export {
	initializeMaterializationWindow as initializeWindow,
	cleanupOldMaterializedInstances as cleanupOldInstances,
	calculateInstanceOccurrences as calculateOccurrences,
	resolveInstanceWithInheritance as resolveInstance,
} from "./eventMaterialization";
