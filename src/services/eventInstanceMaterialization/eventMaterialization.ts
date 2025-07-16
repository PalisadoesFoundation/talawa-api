import { and, eq, gte, lte } from "drizzle-orm";
import { eventExceptionsTable } from "~/src/drizzle/tables/eventExceptions";
import { eventsTable } from "~/src/drizzle/tables/events";
import type { CreateMaterializedInstanceInput } from "~/src/drizzle/tables/materializedEventInstances";
import {
	materializedEventInstancesTable,
	materializedEventInstancesTableInsertSchema,
} from "~/src/drizzle/tables/materializedEventInstances";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";

import { calculateInstanceOccurrences } from "./occurrenceCalculator";
import type { MaterializeInstancesInput, ServiceDependencies } from "./types";

/**
 * Creates materialized instances for a recurring event within a time window.
 */
export async function materializeInstancesForRecurringEvent(
	input: MaterializeInstancesInput,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<number> {
	const {
		baseRecurringEventId,
		windowStartDate,
		windowEndDate,
		organizationId,
	} = input;

	try {
		// Get base template and recurrence rule
		const [baseTemplate, recurrenceRule] = await Promise.all([
			drizzleClient.query.eventsTable.findFirst({
				where: and(
					eq(eventsTable.id, baseRecurringEventId),
					eq(eventsTable.isRecurringTemplate, true),
					eq(eventsTable.organizationId, organizationId),
				),
			}),
			drizzleClient.query.recurrenceRulesTable.findFirst({
				where: eq(
					recurrenceRulesTable.baseRecurringEventId,
					baseRecurringEventId,
				),
			}),
		]);

		if (!baseTemplate || !recurrenceRule) {
			logger.error(
				`Base template or recurrence rule not found for ${baseRecurringEventId}`,
				{ baseTemplate: !!baseTemplate, recurrenceRule: !!recurrenceRule },
			);
			throw new Error(
				`Base template or recurrence rule not found: ${baseRecurringEventId}`,
			);
		}

		// Get existing exceptions
		const exceptions = await drizzleClient.query.eventExceptionsTable.findMany({
			where: eq(eventExceptionsTable.recurringEventId, baseRecurringEventId),
		});

		// Calculate occurrence times
		const occurrences = calculateInstanceOccurrences(
			{
				recurrenceRule,
				baseEvent: baseTemplate,
				windowStart: windowStartDate,
				windowEnd: windowEndDate,
				exceptions,
			},
			logger,
		);

		logger.info(
			`Generated ${occurrences.length} occurrences for ${baseRecurringEventId}`,
			{
				frequency: recurrenceRule.frequency,
				firstOccurrence:
					occurrences[0]?.originalStartTime.toISOString() ?? null,
				lastOccurrence:
					occurrences[
						occurrences.length - 1
					]?.originalStartTime.toISOString() ?? null,
			},
		);

		// Filter out existing instances and create new ones
		const newInstancesCount = await createNewMaterializedInstances(
			occurrences,
			baseRecurringEventId,
			recurrenceRule.id,
			organizationId,
			windowStartDate,
			windowEndDate,
			drizzleClient,
			logger,
		);

		return newInstancesCount;
	} catch (error) {
		logger.error(
			`Failed to materialize instances for ${baseRecurringEventId}:`,
			error,
		);
		throw error;
	}
}

/**
 * Creates new materialized instances, filtering out existing ones
 */
async function createNewMaterializedInstances(
	occurrences: Array<{
		originalStartTime: Date;
		actualStartTime: Date;
		actualEndTime: Date;
		isCancelled: boolean;
		sequenceNumber: number;
		totalCount: number | null;
	}>,
	baseRecurringEventId: string,
	recurrenceRuleId: string,
	organizationId: string,
	windowStartDate: Date,
	windowEndDate: Date,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<number> {
	if (occurrences.length === 0) {
		return 0;
	}

	// Filter out existing instances
	const existingInstances =
		await drizzleClient.query.materializedEventInstancesTable.findMany({
			where: and(
				eq(
					materializedEventInstancesTable.baseRecurringEventId,
					baseRecurringEventId,
				),
				gte(
					materializedEventInstancesTable.originalInstanceStartTime,
					windowStartDate,
				),
				lte(
					materializedEventInstancesTable.originalInstanceStartTime,
					windowEndDate,
				),
			),
			columns: { originalInstanceStartTime: true },
		});

	const existingTimes = new Set(
		existingInstances.map((i: { originalInstanceStartTime: Date }) =>
			i.originalInstanceStartTime.toISOString(),
		),
	);

	const newOccurrences = occurrences.filter(
		(o) => !existingTimes.has(o.originalStartTime.toISOString()),
	);

	if (newOccurrences.length === 0) {
		logger.info(
			`No new instances to create for ${baseRecurringEventId} (${existingInstances.length} already exist)`,
		);
		return 0;
	}

	// Create new instances
	const createInputs: CreateMaterializedInstanceInput[] = newOccurrences.map(
		(occurrence) => ({
			baseRecurringEventId,
			recurrenceRuleId,
			originalInstanceStartTime: occurrence.originalStartTime,
			actualStartTime: occurrence.actualStartTime,
			actualEndTime: occurrence.actualEndTime,
			organizationId,
			isCancelled: occurrence.isCancelled,
			sequenceNumber: occurrence.sequenceNumber,
			totalCount: occurrence.totalCount,
		}),
	);

	const validatedInputs = createInputs.map((input) => {
		return materializedEventInstancesTableInsertSchema.parse(input);
	});

	await drizzleClient
		.insert(materializedEventInstancesTable)
		.values(validatedInputs);

	logger.info(
		`Created ${newOccurrences.length} materialized instances for ${baseRecurringEventId}`,
	);

	return newOccurrences.length;
}

// Re-export functions from other modules for convenience
export {
	initializeMaterializationWindow,
	cleanupOldMaterializedInstances,
} from "./windowManager";
export { calculateInstanceOccurrences } from "./occurrenceCalculator";
export { resolveInstanceWithInheritance } from "./instanceResolver";
