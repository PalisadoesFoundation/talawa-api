import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { eventExceptionsTable } from "~/src/drizzle/tables/eventExceptions";
import { eventsTable } from "~/src/drizzle/tables/events";
import type { ResolvedMaterializedEventInstance } from "~/src/drizzle/tables/materializedEventInstances";
import { materializedEventInstancesTable } from "~/src/drizzle/tables/materializedEventInstances";
import {
	createExceptionLookupMap,
	createTemplateLookupMap,
	resolveInstanceWithInheritance,
	resolveMultipleInstances,
} from "~/src/services/eventInstanceMaterialization/instanceResolver";
import type { ServiceDependencies } from "~/src/services/eventInstanceMaterialization/types";

export interface GetMaterializedInstancesInput {
	organizationId: string;
	startDate: Date;
	endDate: Date;
	includeCancelled?: boolean;
	limit?: number;
}

/**
 * Gets materialized instances for an organization within a date range.
 * Resolves each instance with inheritance from template + exceptions.
 *
 * This demonstrates the exception table only approach:
 * 1. Get materialized instances (just dates and metadata)
 * 2. Get base templates (for inheritance)
 * 3. Get exceptions (for overrides)
 * 4. Resolve inheritance + exceptions at runtime
 */
export async function getMaterializedInstancesInDateRange(
	input: GetMaterializedInstancesInput,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<ResolvedMaterializedEventInstance[]> {
	const {
		organizationId,
		startDate,
		endDate,
		includeCancelled = false,
		limit = 100,
	} = input;

	try {
		// Step 1: Get materialized instances for the date range
		const instances = await fetchMaterializedInstances(
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
			`Failed to get materialized instances for organization ${organizationId}:`,
			error,
		);
		throw error;
	}
}

/**
 * Gets multiple resolved materialized instances by their IDs.
 * This is a batch operation to avoid N+1 queries.
 */
export async function getMaterializedInstancesByIds(
	instanceIds: string[],
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<ResolvedMaterializedEventInstance[]> {
	if (instanceIds.length === 0) {
		return [];
	}

	try {
		// Step 1: Get all materialized instances by their IDs
		const instances =
			await drizzleClient.query.materializedEventInstancesTable.findMany({
				where: inArray(materializedEventInstancesTable.id, instanceIds),
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
		logger.error("Failed to get materialized instances by IDs:", error);
		throw error;
	}
}

/**
 * Gets a single resolved materialized instance by ID.
 */
export async function getMaterializedInstanceById(
	instanceId: string,
	organizationId: string,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<ResolvedMaterializedEventInstance | null> {
	try {
		// Get the materialized instance
		const instance =
			await drizzleClient.query.materializedEventInstancesTable.findFirst({
				where: and(
					eq(materializedEventInstancesTable.id, instanceId),
					eq(materializedEventInstancesTable.organizationId, organizationId),
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
			materializedInstance: instance,
			baseTemplate,
			exception,
		});
	} catch (error) {
		logger.error(`Failed to get materialized instance ${instanceId}:`, error);
		throw error;
	}
}

/**
 * Fetches materialized instances from database with proper filtering
 */
async function fetchMaterializedInstances(
	input: GetMaterializedInstancesInput,
	drizzleClient: ServiceDependencies["drizzleClient"],
): Promise<(typeof materializedEventInstancesTable.$inferSelect)[]> {
	const { organizationId, startDate, endDate, includeCancelled, limit } = input;

	const whereConditions = [
		eq(materializedEventInstancesTable.organizationId, organizationId),
		gte(materializedEventInstancesTable.actualStartTime, startDate),
		lte(materializedEventInstancesTable.actualEndTime, endDate),
	];

	if (!includeCancelled) {
		whereConditions.push(
			eq(materializedEventInstancesTable.isCancelled, false),
		);
	}

	return await drizzleClient.query.materializedEventInstancesTable.findMany({
		where: and(...whereConditions),
		orderBy: [desc(materializedEventInstancesTable.actualStartTime)],
		limit,
	});
}

/**
 * Fetches base templates for given instances
 */
async function fetchBaseTemplates(
	instances: (typeof materializedEventInstancesTable.$inferSelect)[],
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
 * Fetches exceptions for given instances within date range
 */
async function fetchExceptions(
	instances: (typeof materializedEventInstancesTable.$inferSelect)[],
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
