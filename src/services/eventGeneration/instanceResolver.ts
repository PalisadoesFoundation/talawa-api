import type { eventsTable } from "~/src/drizzle/tables/events";
import type { eventExceptionsTable } from "~/src/drizzle/tables/recurringEventExceptions";
import type {
	ResolvedRecurringEventInstance,
	recurringEventInstancesTable,
} from "~/src/drizzle/tables/recurringEventInstances";
import type { ResolveInstanceInput, ServiceDependencies } from "./types";

/**
 * Resolves a single generated instance by combining the properties of the base event template
 * with any applicable exceptions. This function forms the core of the inheritance logic,
 * ensuring that each instance accurately reflects its intended state.
 *
 * @param input - An object containing the generated instance, base template, and optional exception.
 * @returns - A fully resolved generated event instance with all properties correctly inherited and overridden.
 */
export function resolveInstanceWithInheritance(
	input: ResolveInstanceInput,
): ResolvedRecurringEventInstance {
	const { generatedInstance, baseTemplate, exception } = input;

	// Start with inherited properties from base template
	const resolvedInstance: ResolvedRecurringEventInstance = {
		// Core instance metadata
		id: generatedInstance.id,
		baseRecurringEventId: generatedInstance.baseRecurringEventId,
		originalSeriesId: generatedInstance.originalSeriesId,
		recurrenceRuleId: generatedInstance.recurrenceRuleId,
		originalInstanceStartTime: generatedInstance.originalInstanceStartTime,
		actualStartTime: generatedInstance.actualStartTime,
		actualEndTime: generatedInstance.actualEndTime,
		isCancelled: generatedInstance.isCancelled,
		organizationId: generatedInstance.organizationId,
		generatedAt: generatedInstance.generatedAt,
		lastUpdatedAt: generatedInstance.lastUpdatedAt,
		version: generatedInstance.version,

		// Sequence metadata for recurring series
		sequenceNumber: generatedInstance.sequenceNumber,
		totalCount: generatedInstance.totalCount,

		// Inherited event properties (from base template)
		name: baseTemplate.name,
		description: baseTemplate.description,
		location: baseTemplate.location,
		allDay: baseTemplate.allDay,
		isPublic: baseTemplate.isPublic,
		isRegisterable: baseTemplate.isRegisterable,
		isInviteOnly: baseTemplate.isInviteOnly,
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
 * Applies exception data to a resolved instance, overriding base template properties
 * with the specified changes. This function handles the logic of which fields can be
 * modified and ensures that the updates are applied correctly.
 *
 * @param resolvedInstance - The instance to which the exception data will be applied.
 * @param exceptionData - An object containing the exception data to apply.
 */
function applyExceptionData(
	resolvedInstance: ResolvedRecurringEventInstance,
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
 * Validates whether a given field is eligible to be overridden by exception data.
 * This function maintains a list of overridable fields to prevent unintended modifications.
 *
 * @param fieldName - The name of the field to validate.
 * @param resolvedInstance - The resolved instance, used to check for field existence.
 * @returns `true` if the field is valid for overriding, otherwise `false`.
 */
function isValidExceptionField(
	fieldName: string,
	resolvedInstance: ResolvedRecurringEventInstance,
): boolean {
	// Define which fields can be overridden by exceptions
	const overridableFields = [
		"name",
		"description",
		"location",
		"allDay",
		"isPublic",
		"isRegisterable",
		"isInviteOnly",
		"actualStartTime",
		"actualEndTime",
		"isCancelled",
	];

	// Check if field exists in resolved instance and is overridable
	return overridableFields.includes(fieldName) && fieldName in resolvedInstance;
}

/**
 * Resolves multiple generated instances in a batch operation to improve performance.
 * This function iterates through a list of instances and applies the inheritance and
 * exception logic to each one.
 *
 * @param instances - An array of generated instances to resolve.
 * @param templatesMap - A map of base event templates, keyed by their IDs.
 * @param exceptionsMap - A map of event exceptions, keyed by a composite key.
 * @param logger - The logger for logging warnings or errors.
 * @returns - An array of fully resolved generated event instances.
 */
export function resolveMultipleInstances(
	instances: (typeof recurringEventInstancesTable.$inferSelect)[],
	templatesMap: Map<string, typeof eventsTable.$inferSelect>,
	exceptionsMap: Map<string, typeof eventExceptionsTable.$inferSelect>,
	logger: ServiceDependencies["logger"],
): ResolvedRecurringEventInstance[] {
	const resolvedInstances: ResolvedRecurringEventInstance[] = [];

	for (const instance of instances) {
		const baseTemplate = templatesMap.get(instance.baseRecurringEventId);
		if (!baseTemplate) {
			logger.warn(`Base template not found for instance ${instance.id}`);
			continue;
		}

		// Find exception for this specific instance using direct ID lookup
		const exception = exceptionsMap.get(instance.id);

		// Debug logging for exceptions
		if (exception) {
			logger.debug(
				{
					instanceId: instance.id,
					exceptionId: exception.id,
					exceptionData: exception.exceptionData,
				},
				`Found exception for instance ${instance.id}`,
			);
		}

		const resolved = resolveInstanceWithInheritance({
			generatedInstance: instance,
			baseTemplate,
			exception,
		});

		resolvedInstances.push(resolved);
	}

	return resolvedInstances;
}

/**
 * Creates a composite key for the exception lookup map.
 * This key is used to uniquely identify an exception based on the recurring event ID
 * and the original start time of the instance.
 *
 * @param recurringEventId - The ID of the recurring event.
 * @param instanceStartTime - The original start time of the instance.
 * @returns - A string representing the composite key.
 */
export function createExceptionKey(
	recurringEventId: string,
	instanceStartTime: Date,
): string {
	return `${recurringEventId}:${instanceStartTime.toISOString()}`;
}

/**
 * Creates a lookup map for event exceptions to enable efficient batch processing.
 * The map is keyed by a composite key of the recurring event ID and instance start time.
 *
 * @param exceptions - An array of event exceptions.
 * @returns - A map of exceptions, keyed for quick lookup.
 */
export function createExceptionLookupMap(
	exceptions: (typeof eventExceptionsTable.$inferSelect)[],
): Map<string, typeof eventExceptionsTable.$inferSelect> {
	const exceptionMap = new Map<
		string,
		typeof eventExceptionsTable.$inferSelect
	>();

	for (const exception of exceptions) {
		// Use direct instance ID as the key for the new clean design
		const key = exception.recurringEventInstanceId;
		exceptionMap.set(key, exception);
	}

	return exceptionMap;
}

/**
 * Creates a lookup map for event templates to enable efficient batch processing.
 * The map is keyed by the event template ID.
 *
 * @param templates - An array of event templates.
 * @returns - A map of templates, keyed by their IDs.
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
 * Validates that a resolved generated instance contains all required fields.
 * This function helps ensure data integrity before the instance is used elsewhere.
 *
 * @param resolvedInstance - The resolved instance to validate.
 * @param logger - The logger for reporting any missing fields.
 * @returns `true` if the instance is valid, otherwise `false`.
 */
export function validateResolvedInstance(
	resolvedInstance: ResolvedRecurringEventInstance,
	logger: ServiceDependencies["logger"],
): boolean {
	const requiredFields = [
		"id",
		"baseRecurringEventId",
		"originalSeriesId",
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
