import { and, eq, gte, lte } from "drizzle-orm";
import { eventExceptionsTable } from "~/src/drizzle/tables/eventExceptions";
import { eventsTable } from "~/src/drizzle/tables/events";
import type { CreateMaterializedInstanceInput } from "~/src/drizzle/tables/materializedEventInstances";
import {
	materializedEventInstancesTable,
	materializedEventInstancesTableInsertSchema,
} from "~/src/drizzle/tables/materializedEventInstances";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";

import { normalizeRecurrenceRule } from "~/src/utilities/recurringEventHelpers";
import { calculateInstanceOccurrences } from "./occurrenceCalculator";
import type { MaterializeInstancesInput, ServiceDependencies } from "./types";

/**
 * Generates and stores materialized instances for a recurring event within a specified time window.
 * This function fetches the base event template and recurrence rule, calculates all occurrences,
 * and creates new instances in the database, avoiding duplicates.
 *
 * @param input - The input object containing the event ID, time window, and organization ID.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns A promise that resolves to the number of newly created materialized instances.
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

		// Normalize the recurrence rule (convert count to end date for unified processing)
		const normalizedRecurrenceRule = normalizeRecurrenceRule(recurrenceRule);

		// Calculate occurrence times using normalized rule
		const occurrences = calculateInstanceOccurrences(
			{
				recurrenceRule: normalizedRecurrenceRule,
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
				frequency: normalizedRecurrenceRule.frequency,
				originalCount: recurrenceRule.count,
				normalizedEndDate:
					normalizedRecurrenceRule.recurrenceEndDate?.toISOString(),
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
 * Creates new materialized instances in the database from a list of calculated occurrences,
 * after filtering out any instances that already exist.
 *
 * @param occurrences - An array of calculated occurrence data.
 * @param baseRecurringEventId - The ID of the base recurring event.
 * @param recurrenceRuleId - The ID of the associated recurrence rule.
 * @param organizationId - The ID of the organization.
 * @param windowStartDate - The start of the materialization window.
 * @param windowEndDate - The end of the materialization window.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns A promise that resolves to the number of newly created instances.
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

export {
	initializeMaterializationWindow,
	cleanupOldMaterializedInstances,
} from "./windowManager";
export { calculateInstanceOccurrences } from "./occurrenceCalculator";
export { resolveInstanceWithInheritance } from "./instanceResolver";
