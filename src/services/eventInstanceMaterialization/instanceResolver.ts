import type { eventExceptionsTable } from "~/src/drizzle/tables/eventExceptions";
import type { eventsTable } from "~/src/drizzle/tables/events";
import type { materializedEventInstancesTable } from "~/src/drizzle/tables/materializedEventInstances";
import type { ResolvedMaterializedEventInstance } from "~/src/drizzle/tables/materializedEventInstances";
import type { ResolveInstanceInput, ServiceDependencies } from "./types";

/**
 * Resolves a single materialized instance with inheritance from base template + exception.
 *
 * This is the core inheritance logic:
 * 1. Start with base template properties
 * 2. Apply exception overrides if they exist
 * 3. Return fully resolved instance
 */
export function resolveInstanceWithInheritance(
	input: ResolveInstanceInput,
): ResolvedMaterializedEventInstance {
	const { materializedInstance, baseTemplate, exception } = input;

	// Start with inherited properties from base template
	const resolvedInstance: ResolvedMaterializedEventInstance = {
		// Core instance metadata
		id: materializedInstance.id,
		baseRecurringEventId: materializedInstance.baseRecurringEventId,
		recurrenceRuleId: materializedInstance.recurrenceRuleId,
		originalInstanceStartTime: materializedInstance.originalInstanceStartTime,
		actualStartTime: materializedInstance.actualStartTime,
		actualEndTime: materializedInstance.actualEndTime,
		isCancelled: materializedInstance.isCancelled,
		organizationId: materializedInstance.organizationId,
		materializedAt: materializedInstance.materializedAt,
		lastUpdatedAt: materializedInstance.lastUpdatedAt,
		version: materializedInstance.version,

		// Sequence metadata for recurring series
		sequenceNumber: materializedInstance.sequenceNumber,
		totalCount: materializedInstance.totalCount,

		// Inherited event properties (from base template)
		name: baseTemplate.name,
		description: baseTemplate.description,
		location: baseTemplate.location,
		allDay: baseTemplate.allDay,
		isPublic: baseTemplate.isPublic,
		isRegisterable: baseTemplate.isRegisterable,
		creatorId: baseTemplate.creatorId,
		updaterId: baseTemplate.updaterId,
		createdAt: baseTemplate.createdAt,
		updatedAt: baseTemplate.updatedAt,

		// Exception metadata
		hasExceptions: !!exception,
		appliedExceptionData: exception?.exceptionData as Record<
			string,
			unknown
		> | null,
		exceptionCreatedBy: exception?.creatorId || null,
		exceptionCreatedAt: exception?.createdAt || null,
	};

	// Apply exception data if it exists
	if (exception?.exceptionData) {
		applyExceptionData(
			resolvedInstance,
			exception.exceptionData as Record<string, unknown>,
		);
	}

	return resolvedInstance;
}

/**
 * Applies exception data to a resolved instance.
 * This function handles the logic of which fields can be overridden and how.
 */
function applyExceptionData(
	resolvedInstance: ResolvedMaterializedEventInstance,
	exceptionData: Record<string, unknown>,
): void {
	// Apply each exception field to the resolved instance
	for (const [key, value] of Object.entries(exceptionData)) {
		if (isValidExceptionField(key, resolvedInstance) && value !== undefined) {
			(resolvedInstance as unknown as Record<string, unknown>)[key] = value;
		}
	}

	// Handle special cases for cancellation status
	if (exceptionData.isCancelled !== undefined) {
		resolvedInstance.isCancelled = exceptionData.isCancelled as boolean;
	}

	// Handle time-related exception fields with validation
	if (exceptionData.startAt) {
		resolvedInstance.actualStartTime = new Date(
			exceptionData.startAt as string | number | Date,
		);
	}

	if (exceptionData.endAt) {
		resolvedInstance.actualEndTime = new Date(
			exceptionData.endAt as string | number | Date,
		);
	}
}

/**
 * Validates if a field can be overridden by exception data
 */
function isValidExceptionField(
	fieldName: string,
	resolvedInstance: ResolvedMaterializedEventInstance,
): boolean {
	// Define which fields can be overridden by exceptions
	const overridableFields = [
		"name",
		"description",
		"location",
		"allDay",
		"isPublic",
		"isRegisterable",
		"actualStartTime",
		"actualEndTime",
		"isCancelled",
	];

	// Check if field exists in resolved instance and is overridable
	return overridableFields.includes(fieldName) && fieldName in resolvedInstance;
}

/**
 * Resolves multiple instances in batch for better performance
 */
export function resolveMultipleInstances(
	instances: (typeof materializedEventInstancesTable.$inferSelect)[],
	templatesMap: Map<string, typeof eventsTable.$inferSelect>,
	exceptionsMap: Map<string, typeof eventExceptionsTable.$inferSelect>,
	logger: ServiceDependencies["logger"],
): ResolvedMaterializedEventInstance[] {
	const resolvedInstances: ResolvedMaterializedEventInstance[] = [];

	for (const instance of instances) {
		const baseTemplate = templatesMap.get(instance.baseRecurringEventId);
		if (!baseTemplate) {
			logger.warn(`Base template not found for instance ${instance.id}`);
			continue;
		}

		// Find exception for this specific instance using composite key
		const exceptionKey = createExceptionKey(
			instance.baseRecurringEventId,
			instance.originalInstanceStartTime,
		);
		const exception = exceptionsMap.get(exceptionKey);

		const resolved = resolveInstanceWithInheritance({
			materializedInstance: instance,
			baseTemplate,
			exception,
		});

		resolvedInstances.push(resolved);
	}

	return resolvedInstances;
}

/**
 * Creates a composite key for exception lookup
 */
export function createExceptionKey(
	recurringEventId: string,
	instanceStartTime: Date,
): string {
	return `${recurringEventId}:${instanceStartTime.toISOString()}`;
}

/**
 * Creates exception lookup maps for efficient batch processing
 */
export function createExceptionLookupMap(
	exceptions: (typeof eventExceptionsTable.$inferSelect)[],
): Map<string, typeof eventExceptionsTable.$inferSelect> {
	const exceptionMap = new Map<
		string,
		typeof eventExceptionsTable.$inferSelect
	>();

	for (const exception of exceptions) {
		const key = createExceptionKey(
			exception.recurringEventId,
			exception.instanceStartTime,
		);
		exceptionMap.set(key, exception);
	}

	return exceptionMap;
}

/**
 * Creates template lookup maps for efficient batch processing
 */
export function createTemplateLookupMap(
	templates: (typeof eventsTable.$inferSelect)[],
): Map<string, typeof eventsTable.$inferSelect> {
	const templateMap = new Map<string, typeof eventsTable.$inferSelect>();

	for (const template of templates) {
		templateMap.set(template.id, template);
	}

	return templateMap;
}

/**
 * Validates that a resolved instance has all required fields
 */
export function validateResolvedInstance(
	resolvedInstance: ResolvedMaterializedEventInstance,
	logger: ServiceDependencies["logger"],
): boolean {
	const requiredFields = [
		"id",
		"baseRecurringEventId",
		"originalInstanceStartTime",
		"actualStartTime",
		"actualEndTime",
		"organizationId",
		"name",
	];

	for (const field of requiredFields) {
		if (
			!(field in resolvedInstance) ||
			(resolvedInstance as unknown as Record<string, unknown>)[field] ===
				undefined
		) {
			logger.error(`Missing required field in resolved instance: ${field}`);
			return false;
		}
	}

	return true;
}
