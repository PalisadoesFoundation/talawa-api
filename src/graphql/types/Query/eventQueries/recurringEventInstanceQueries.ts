import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { eventExceptionsTable } from "~/src/drizzle/tables/eventExceptions";
import { eventsTable } from "~/src/drizzle/tables/events";
import type { ResolvedRecurringEventInstance } from "~/src/drizzle/tables/recurringEventInstances";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import {
	createExceptionLookupMap,
	createTemplateLookupMap,
	resolveInstanceWithInheritance,
	resolveMultipleInstances,
} from "~/src/services/eventGeneration/instanceResolver";
import type { ServiceDependencies } from "~/src/services/eventGeneration/types";

/**
 * @description Defines the input parameters for querying recurring event event instances.
 */
export interface GetRecurringEventInstancesInput {
	organizationId: string;
	startDate: Date;
	endDate: Date;
	includeCancelled?: boolean;
	/**
	 * @description An optional limit on the number of instances to return.
	 */
	limit?: number;
}

/**
 * Retrieves recurring event event instances for a given organization within a specified date range.
 * This function resolves each instance by combining data from the base event template
 * with any applicable exceptions, providing a complete and accurate representation of each event instance.
 *
 * @param input - The input object containing organizationId, date range, and optional filters.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns A promise that resolves to an array of fully resolved recurring event event instances.
 */
export async function getRecurringEventInstancesInDateRange(
	input: GetRecurringEventInstancesInput,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<ResolvedRecurringEventInstance[]> {
	const {
		organizationId,
		startDate,
		endDate,
		includeCancelled = false,
		limit = 100,
	} = input;

	try {
		// Step 1: Get recurring event instances for the date range
		const instances = await fetchRecurringEventInstances(
			{ organizationId, startDate, endDate, includeCancelled, limit },
			drizzleClient,
		);

		if (instances.length === 0) {
			return [];
		}

		// Step 2: Get base templates and exceptions
		const [templatesMap, exceptionsMap] = await Promise.all([
			fetchBaseTemplates(instances, drizzleClient),
			fetchExceptions(instances, startDate, endDate, drizzleClient),
		]);

		// Step 3: Resolve instances with inheritance + exceptions
		const resolvedInstances = resolveMultipleInstances(
			instances,
			templatesMap,
			exceptionsMap,
			logger,
		);

		return resolvedInstances;
	} catch (error) {
		logger.error(
			`Failed to get recurring event instances for organization ${organizationId}:`,
			error,
		);
		throw error;
	}
}

/**
 * Retrieves multiple resolved recurring event instances by their specific IDs.
 * This function performs a batch operation to efficiently fetch and resolve instances,
 * avoiding the N+1 query problem.
 *
 * @param instanceIds - An array of recurring event instance IDs to retrieve.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns A promise that resolves to an array of the requested resolved recurring event event instances.
 */
export async function getRecurringEventInstancesByIds(
	instanceIds: string[],
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<ResolvedRecurringEventInstance[]> {
	if (instanceIds.length === 0) {
		return [];
	}

	try {
		// Step 1: Get all recurring event instances by their IDs
		const instances =
			await drizzleClient.query.recurringEventInstancesTable.findMany({
				where: inArray(recurringEventInstancesTable.id, instanceIds),
			});

		if (instances.length === 0) {
			return [];
		}

		// Step 2: Get base templates and exceptions for the found instances
		// We need a date range for exceptions. Since we don't have one, we'll fetch
		// exceptions based on the instance's original start time.
		const instanceStartTimes = instances.map(
			(i: { originalInstanceStartTime: Date }) => i.originalInstanceStartTime,
		);
		const minDate = new Date(
			Math.min(...instanceStartTimes.map((d: Date) => d.getTime())),
		);
		const maxDate = new Date(
			Math.max(...instanceStartTimes.map((d: Date) => d.getTime())),
		);

		const [templatesMap, exceptionsMap] = await Promise.all([
			fetchBaseTemplates(instances, drizzleClient),
			fetchExceptions(instances, minDate, maxDate, drizzleClient),
		]);

		// Step 3: Resolve instances with inheritance + exceptions
		const resolvedInstances = resolveMultipleInstances(
			instances,
			templatesMap,
			exceptionsMap,
			logger,
		);

		return resolvedInstances;
	} catch (error) {
		logger.error("Failed to get recurring event instances by IDs:", error);
		throw error;
	}
}

/**
 * Retrieves a single resolved recurring event instance by its ID and organization ID.
 *
 * @param instanceId - The ID of the recurring event instance to retrieve.
 * @param organizationId - The ID of the organization to which the instance belongs.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns A promise that resolves to the resolved recurring event event instance, or null if not found.
 */
export async function getRecurringEventInstanceById(
	instanceId: string,
	organizationId: string,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<ResolvedRecurringEventInstance | null> {
	try {
		// Get the recurring event instance
		const instance =
			await drizzleClient.query.recurringEventInstancesTable.findFirst({
				where: and(
					eq(recurringEventInstancesTable.id, instanceId),
					eq(recurringEventInstancesTable.organizationId, organizationId),
				),
			});

		if (!instance) {
			return null;
		}

		// Get base template
		const baseTemplate = await drizzleClient.query.eventsTable.findFirst({
			where: eq(eventsTable.id, instance.baseRecurringEventId),
		});

		if (!baseTemplate) {
			throw new Error(
				`Base template not found: ${instance.baseRecurringEventId}`,
			);
		}

		// Get exception if exists
		const exception = await drizzleClient.query.eventExceptionsTable.findFirst({
			where: and(
				eq(
					eventExceptionsTable.recurringEventId,
					instance.baseRecurringEventId,
				),
				eq(
					eventExceptionsTable.instanceStartTime,
					instance.originalInstanceStartTime,
				),
			),
		});

		// Resolve with inheritance + exception
		return resolveInstanceWithInheritance({
			generatedInstance: instance,
			baseTemplate,
			exception,
		});
	} catch (error) {
		logger.error(
			`Failed to get recurring event instance ${instanceId}:`,
			error,
		);
		throw error;
	}
}

/**
 * Fetches raw recurring event instances from the database based on the provided input filters.
 *
 * @param input - The input object containing filtering criteria.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @returns A promise that resolves to an array of raw recurring event event instances.
 */
async function fetchRecurringEventInstances(
	input: GetRecurringEventInstancesInput,
	drizzleClient: ServiceDependencies["drizzleClient"],
): Promise<(typeof recurringEventInstancesTable.$inferSelect)[]> {
	const { organizationId, startDate, endDate, includeCancelled, limit } = input;

	const whereConditions = [
		eq(recurringEventInstancesTable.organizationId, organizationId),
		gte(recurringEventInstancesTable.actualStartTime, startDate),
		lte(recurringEventInstancesTable.actualEndTime, endDate),
	];

	if (!includeCancelled) {
		whereConditions.push(eq(recurringEventInstancesTable.isCancelled, false));
	}

	return await drizzleClient.query.recurringEventInstancesTable.findMany({
		where: and(...whereConditions),
		orderBy: [desc(recurringEventInstancesTable.actualStartTime)],
		limit,
	});
}

/**
 * Fetches the base event templates for a given list of recurring event instances.
 *
 * @param instances - An array of recurring event instances.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @returns A promise that resolves to a map of base event templates, keyed by their IDs.
 */
async function fetchBaseTemplates(
	instances: (typeof recurringEventInstancesTable.$inferSelect)[],
	drizzleClient: ServiceDependencies["drizzleClient"],
): Promise<Map<string, typeof eventsTable.$inferSelect>> {
	const baseEventIds = [
		...new Set(instances.map((instance) => instance.baseRecurringEventId)),
	];

	const baseTemplates = await drizzleClient.query.eventsTable.findMany({
		where: inArray(eventsTable.id, baseEventIds),
	});

	return createTemplateLookupMap(baseTemplates);
}

/**
 * Fetches event exceptions for a given list of instances within a specified date range.
 *
 * @param instances - An array of recurring event instances.
 * @param startDate - The start of the date range to check for exceptions.
 * @param endDate - The end of the date range to check for exceptions.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @returns A promise that resolves to a map of event exceptions, keyed by a composite key of event ID and instance start time.
 */
async function fetchExceptions(
	instances: (typeof recurringEventInstancesTable.$inferSelect)[],
	startDate: Date,
	endDate: Date,
	drizzleClient: ServiceDependencies["drizzleClient"],
): Promise<Map<string, typeof eventExceptionsTable.$inferSelect>> {
	const baseEventIds = [
		...new Set(instances.map((instance) => instance.baseRecurringEventId)),
	];

	const exceptions = await drizzleClient.query.eventExceptionsTable.findMany({
		where: and(
			inArray(eventExceptionsTable.recurringEventId, baseEventIds),
			gte(eventExceptionsTable.instanceStartTime, startDate),
			lte(eventExceptionsTable.instanceStartTime, endDate),
		),
	});

	return createExceptionLookupMap(exceptions);
}
