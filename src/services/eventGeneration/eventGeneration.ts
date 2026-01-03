import { and, eq, gte, lte } from "drizzle-orm";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type { eventExceptionsTable } from "~/src/drizzle/tables/recurringEventExceptions";
import type { CreateRecurringEventInstanceInput } from "~/src/drizzle/tables/recurringEventInstances";
import {
	recurringEventInstancesTable,
	recurringEventInstancesTableInsertSchema,
} from "~/src/drizzle/tables/recurringEventInstances";

import { normalizeRecurrenceRule } from "~/src/utilities/recurringEvent";
import { calculateInstanceOccurrences } from "./occurrenceCalculator";
import type { GenerateInstancesInput, ServiceDependencies } from "./types";

/**
 * Generates and stores generated instances for a recurring event within a specified time window.
 * This function fetches the base event template and recurrence rule, calculates all occurrences,
 * and creates new instances in the database, avoiding duplicates.
 *
 * @param input - The input object containing the event ID, time window, and organization ID.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns - A promise that resolves to the number of newly created generated instances.
 */
export async function generateInstancesForRecurringEvent(
	input: GenerateInstancesInput,
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
					eq(eventsTable.isRecurringEventTemplate, true),
					eq(eventsTable.organizationId, organizationId),
				),
			}),
			drizzleClient.query.recurrenceRulesTable.findFirst({
				columns: {
					id: true,
					originalSeriesId: true,
					frequency: true,
					interval: true,
					recurrenceStartDate: true,
					recurrenceEndDate: true,
					count: true,
					byDay: true,
					byMonth: true,
					byMonthDay: true,
				},
				where: eq(
					recurrenceRulesTable.baseRecurringEventId,
					baseRecurringEventId,
				),
			}),
		]);

		if (!baseTemplate || !recurrenceRule) {
			logger.error(
				{ baseTemplate: !!baseTemplate, recurrenceRule: !!recurrenceRule },
				`Base template or recurrence rule not found for ${baseRecurringEventId}`,
			);
			throw new Error(
				`Base template or recurrence rule not found: ${baseRecurringEventId}`,
			);
		}

		// For initial generation, we don't need existing exceptions
		// Exceptions are only created when users modify specific instances
		const exceptions: (typeof eventExceptionsTable.$inferSelect)[] = [];

		// Create a full recurrence rule object for normalization
		const fullRecurrenceRule = {
			...recurrenceRule,
			baseRecurringEventId,
			organizationId,
			createdAt: new Date(),
			creatorId: "",
			updatedAt: null,
			updaterId: null,
			recurrenceRuleString: "",
			latestInstanceDate: recurrenceRule.recurrenceStartDate,
		};

		// Normalize the recurrence rule (convert count to end date for unified processing)
		const normalizedRecurrenceRule =
			normalizeRecurrenceRule(fullRecurrenceRule);

		// Preserve original count for proper instance generation
		const preservedOriginalCount = recurrenceRule.count;

		// Calculate occurrence times using normalized rule but with preserved count
		const occurrences = calculateInstanceOccurrences(
			{
				recurrenceRule: {
					...normalizedRecurrenceRule,
					//  Use original count to ensure proper limit enforcement
					count: preservedOriginalCount,
				},
				baseEvent: baseTemplate,
				windowStart: windowStartDate,
				windowEnd: windowEndDate,
				exceptions,
			},
			logger,
		);

		logger.info(
			{
				frequency: normalizedRecurrenceRule.frequency,
				originalCount: preservedOriginalCount,
				normalizedEndDate:
					normalizedRecurrenceRule.recurrenceEndDate?.toISOString(),
				firstOccurrence:
					occurrences[0]?.originalStartTime.toISOString() ?? null,
				lastOccurrence:
					occurrences[
						occurrences.length - 1
					]?.originalStartTime.toISOString() ?? null,
				expectedCount: preservedOriginalCount
					? `Should create exactly ${preservedOriginalCount} occurrences`
					: "No count limit",
				actualCount: `Created ${occurrences.length} occurrences`,
			},
			`Generated ${occurrences.length} occurrences for ${baseRecurringEventId}`,
		);

		// Handle case where originalSeriesId is null
		if (recurrenceRule.originalSeriesId === null) {
			logger.error(
				{ recurrenceRuleId: recurrenceRule.id },
				`Recurrence rule for ${baseRecurringEventId} has null originalSeriesId`,
			);
			throw new Error(
				`Recurrence rule for ${baseRecurringEventId} has null originalSeriesId`,
			);
		}

		// Filter out existing instances and create new ones
		const newInstancesCount = await createNewGeneratedInstances(
			occurrences,
			baseRecurringEventId,
			recurrenceRule.id,
			recurrenceRule.originalSeriesId,
			organizationId,
			windowStartDate,
			windowEndDate,
			drizzleClient,
			logger,
		);

		return newInstancesCount;
	} catch (error) {
		logger.error(
			error,
			`Failed to generate instances for ${baseRecurringEventId}:`,
		);
		throw error;
	}
}

/**
 * Creates new generated instances in the database from a list of calculated occurrences,
 * after filtering out any instances that already exist.
 *
 * @param occurrences - An array of calculated occurrence data.
 * @param baseRecurringEventId - The ID of the base recurring event.
 * @param recurrenceRuleId - The ID of the associated recurrence rule.
 * @param originalSeriesId - The original series ID for tracking logical series across template splits.
 * @param organizationId - The ID of the organization.
 * @param windowStartDate - The start of the event generation window.
 * @param windowEndDate - The end of the event generation window.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns - A promise that resolves to the number of newly created instances.
 */
async function createNewGeneratedInstances(
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
	originalSeriesId: string,
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
		await drizzleClient.query.recurringEventInstancesTable.findMany({
			where: and(
				eq(
					recurringEventInstancesTable.baseRecurringEventId,
					baseRecurringEventId,
				),
				gte(
					recurringEventInstancesTable.originalInstanceStartTime,
					windowStartDate,
				),
				lte(
					recurringEventInstancesTable.originalInstanceStartTime,
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
	const createInputs: CreateRecurringEventInstanceInput[] = newOccurrences.map(
		(occurrence) => ({
			baseRecurringEventId,
			recurrenceRuleId,
			originalSeriesId: originalSeriesId,
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
		return recurringEventInstancesTableInsertSchema.parse(input);
	});

	await drizzleClient
		.insert(recurringEventInstancesTable)
		.values(validatedInputs);

	logger.info(
		`Created ${newOccurrences.length} generated instances for ${baseRecurringEventId}`,
	);

	return newOccurrences.length;
}

export { resolveInstanceWithInheritance } from "./instanceResolver";
export { calculateInstanceOccurrences } from "./occurrenceCalculator";
export {
	cleanupOldGeneratedInstances,
	initializeGenerationWindow,
} from "./windowManager";
