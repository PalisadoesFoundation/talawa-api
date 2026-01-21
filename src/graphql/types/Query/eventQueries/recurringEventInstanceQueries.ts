import { and, asc, eq, gte, inArray, lte, not, or } from "drizzle-orm";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventExceptionsTable } from "~/src/drizzle/tables/recurringEventExceptions";
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
 * Defines the input parameters for querying recurring event instances.
 */
export interface GetRecurringEventInstancesInput {
	organizationId: string;
	startDate: Date;
	endDate: Date;
	includeCancelled?: boolean;
	/**
	 * Optional maximum number of instances to return (defaults to 1000).
	 */
	limit?: number;
	excludeInstanceIds?: string[];
}

/**
 * Retrieves recurring event instances for a given organization within a specified date range.
 * This function resolves each instance by combining data from the base event template
 * with any applicable exceptions, providing a complete and accurate representation of each event instance.
 *
 * @param input - The input object containing organizationId, date range, and optional filters.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns - A promise that resolves to an array of fully resolved recurring event instances.
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
		limit = 1000,
		excludeInstanceIds,
	} = input;

	try {
		// Step 1: Get recurring event instances for the date range
		const instances = await fetchRecurringEventInstances(
			{
				organizationId,
				startDate,
				endDate,
				includeCancelled,
				limit,
				excludeInstanceIds,
			},
			drizzleClient,
		);

		if (instances.length === 0) {
			return [];
		}

		// Step 2: Get base templates and exceptions
		const [templatesMap, exceptionsMap] = await Promise.all([
			fetchBaseTemplates(instances, drizzleClient),
			fetchExceptions(instances, drizzleClient),
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
			error,
			`Failed to get recurring event instances for organization ${organizationId}`,
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
 * @returns - A promise that resolves to an array of the requested resolved recurring event instances.
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

		const [templatesMap, exceptionsMap] = await Promise.all([
			fetchBaseTemplates(instances, drizzleClient),
			fetchExceptions(instances, drizzleClient),
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
		logger.error(error, "Failed to get recurring event instances by IDs");
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
 * @returns - A promise that resolves to the resolved recurring event instance, or null if not found.
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

		// Get exception if exists - now using direct instance ID lookup
		const exception = await drizzleClient.query.eventExceptionsTable.findFirst({
			where: eq(eventExceptionsTable.recurringEventInstanceId, instance.id),
		});

		// Resolve with inheritance + exception
		return resolveInstanceWithInheritance({
			generatedInstance: instance,
			baseTemplate,
			exception: exception || undefined,
		});
	} catch (error) {
		logger.error(error, `Failed to get recurring event instance ${instanceId}`);
		throw error;
	}
}

/**
 * Retrieves all recurring event instances that belong to a specific base recurring event template.
 *
 * @param baseRecurringEventId - The ID of the base recurring event template.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns - A promise that resolves to an array of fully resolved recurring event instances.
 */
export async function getRecurringEventInstancesByBaseId(
	baseRecurringEventId: string,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<ResolvedRecurringEventInstance[]> {
	try {
		// Delegate to the batch helper to avoid code duplication
		return await getRecurringEventInstancesByBaseIds(
			[baseRecurringEventId],
			drizzleClient,
			logger,
		);
	} catch (error) {
		logger.error(
			error,
			`Failed to get recurring event instances for base event ${baseRecurringEventId}`,
		);
		throw error;
	}
}

/**
 * Retrieves all recurring event instances for multiple base recurring event templates.
 * This is a batch version of getRecurringEventInstancesByBaseId to avoid N+1 queries.
 *
 * @param baseRecurringEventIds - Array of base recurring event template IDs.
 * @param drizzleClient - The Drizzle ORM client.
 * @param logger - The logger.
 * @returns - Promise resolving to array of resolved instances.
 */
export async function getRecurringEventInstancesByBaseIds(
	baseRecurringEventIds: string[],
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
	options: {
		limit?: number;
		includeCancelled?: boolean;
		excludeInstanceIds?: string[];
	} = {},
): Promise<ResolvedRecurringEventInstance[]> {
	const { limit, includeCancelled = false, excludeInstanceIds } = options;

	if (baseRecurringEventIds.length === 0) {
		return [];
	}

	try {
		// Step 1: Get all recurring event instances for these base events
		const whereConditions = [
			inArray(
				recurringEventInstancesTable.baseRecurringEventId,
				baseRecurringEventIds,
			),
		];

		if (!includeCancelled) {
			whereConditions.push(eq(recurringEventInstancesTable.isCancelled, false));
		}

		if (excludeInstanceIds && excludeInstanceIds.length > 0) {
			whereConditions.push(
				not(inArray(recurringEventInstancesTable.id, excludeInstanceIds)),
			);
		}

		const instances =
			await drizzleClient.query.recurringEventInstancesTable.findMany({
				where: and(...whereConditions),
				orderBy: [
					asc(recurringEventInstancesTable.actualStartTime),
					asc(recurringEventInstancesTable.id),
				],
				limit,
			});

		if (instances.length === 0) {
			return [];
		}

		// Step 2: Get base templates and exceptions
		const [templatesMap, exceptionsMap] = await Promise.all([
			fetchBaseTemplates(instances, drizzleClient),
			fetchExceptions(instances, drizzleClient),
		]);

		// Step 3: Resolve instances
		return resolveMultipleInstances(
			instances,
			templatesMap,
			exceptionsMap,
			logger,
		);
	} catch (error) {
		logger.error(error, "Failed to get recurring event instances by base IDs");
		throw error;
	}
}

/**
 * Fetches raw recurring event instances from the database based on the provided input filters.
 *
 * @param input - The input object containing filtering criteria.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @returns - A promise that resolves to an array of raw recurring event instances.
 */
async function fetchRecurringEventInstances(
	input: GetRecurringEventInstancesInput & { excludeInstanceIds?: string[] },
	drizzleClient: ServiceDependencies["drizzleClient"],
): Promise<(typeof recurringEventInstancesTable.$inferSelect)[]> {
	const {
		organizationId,
		startDate,
		endDate,
		includeCancelled,
		limit,
		excludeInstanceIds,
	} = input;

	const whereConditions = [
		eq(recurringEventInstancesTable.organizationId, organizationId),
		// Event overlaps with date range - same logic as standalone events
		or(
			// Event starts within range
			and(
				gte(recurringEventInstancesTable.actualStartTime, startDate),
				lte(recurringEventInstancesTable.actualStartTime, endDate),
			),
			// Event ends within range
			and(
				gte(recurringEventInstancesTable.actualEndTime, startDate),
				lte(recurringEventInstancesTable.actualEndTime, endDate),
			),
			// Event spans the entire range
			and(
				lte(recurringEventInstancesTable.actualStartTime, startDate),
				gte(recurringEventInstancesTable.actualEndTime, endDate),
			),
		),
	];

	if (!includeCancelled) {
		whereConditions.push(eq(recurringEventInstancesTable.isCancelled, false));
	}

	if (excludeInstanceIds && excludeInstanceIds.length > 0) {
		whereConditions.push(
			not(inArray(recurringEventInstancesTable.id, excludeInstanceIds)),
		);
	}

	return await drizzleClient.query.recurringEventInstancesTable.findMany({
		where: and(...whereConditions),
		orderBy: [
			asc(recurringEventInstancesTable.actualStartTime),
			asc(recurringEventInstancesTable.id),
		],
		limit,
	});
}

/**
 * Fetches the base event templates for a given list of recurring event instances.
 *
 * @param instances - An array of recurring event instances.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @returns - A promise that resolves to a map of base event templates, keyed by their IDs.
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
 * Fetches event exceptions for a given list of instances.
 * Uses direct instance ID lookups for precise exception matching.
 *
 * @param instances - An array of recurring event instances.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @returns - A promise that resolves to a map of event exceptions, keyed by instance ID.
 */
async function fetchExceptions(
	instances: (typeof recurringEventInstancesTable.$inferSelect)[],
	drizzleClient: ServiceDependencies["drizzleClient"],
): Promise<Map<string, typeof eventExceptionsTable.$inferSelect>> {
	const instanceIds = instances.map((instance) => instance.id);

	if (instanceIds.length === 0) {
		return new Map();
	}

	const exceptions = await drizzleClient.query.eventExceptionsTable.findMany({
		where: inArray(eventExceptionsTable.recurringEventInstanceId, instanceIds),
	});

	return createExceptionLookupMap(exceptions);
}
