import { and, asc, eq, gte, inArray, lte, or } from "drizzle-orm";
import type { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import { eventsTable } from "~/src/drizzle/tables/events";
import type { ServiceDependencies } from "~/src/services/eventGeneration/types";

/**
 * Defines the input parameters for querying standalone events.
 */
export interface GetStandaloneEventsInput {
	organizationId: string;
	startDate: Date;
	endDate: Date;
	/**
	 * An optional array of event IDs to filter by.
	 */
	eventIds?: string[];
	/**
	 * An optional limit on the number of events to return.
	 */
	limit?: number;
}

/**
 * Retrieves standalone (non-recurring) events for a given organization within a specified date range.
 * This function filters out recurring templates and generated instances, focusing only on regular,
 * single-occurrence events that overlap with the provided time window.
 *
 * @param input - The input object containing organizationId, date range, and optional filters.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns - A promise that resolves to an array of standalone event objects, including their attachments.
 */
export async function getStandaloneEventsInDateRange(
	input: GetStandaloneEventsInput,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<
	(typeof eventsTable.$inferSelect & {
		attachments: (typeof eventAttachmentsTable.$inferSelect)[];
	})[]
> {
	const { organizationId, startDate, endDate, eventIds, limit = 1000 } = input;

	try {
		const whereConditions = [
			eq(eventsTable.organizationId, organizationId),
			eq(eventsTable.isRecurringEventTemplate, false),
			// Event overlaps with date range
			or(
				// Event starts within range
				and(
					gte(eventsTable.startAt, startDate),
					lte(eventsTable.startAt, endDate),
				),
				// Event ends within range
				and(gte(eventsTable.endAt, startDate), lte(eventsTable.endAt, endDate)),
				// Event spans the entire range
				and(
					lte(eventsTable.startAt, startDate),
					gte(eventsTable.endAt, endDate),
				),
			),
		];

		// If specific event IDs are requested, filter by them
		if (eventIds && eventIds.length > 0) {
			whereConditions.push(inArray(eventsTable.id, eventIds));
		}

		const standaloneEvents: (typeof eventsTable.$inferSelect & {
			attachmentsWhereEvent: (typeof eventAttachmentsTable.$inferSelect)[];
		})[] = await drizzleClient.query.eventsTable.findMany({
			where: and(...whereConditions),
			with: {
				attachmentsWhereEvent: true,
			},
			orderBy: [asc(eventsTable.startAt), asc(eventsTable.id)],
			limit,
		});

		// Transform to include attachments in expected format
		const eventsWithAttachments = standaloneEvents.map(
			({ attachmentsWhereEvent, ...event }) => ({
				...event,
				attachments: attachmentsWhereEvent || [],
			}),
		);

		logger.debug(
			{
				organizationId,
				count: eventsWithAttachments.length,
				dateRange: {
					start: startDate.toISOString(),
					end: endDate.toISOString(),
				},
				eventIdsFilter: eventIds?.length || 0,
			},
			"Retrieved standalone events",
		);

		return eventsWithAttachments;
	} catch (error) {
		logger.error(
			{
				organizationId,
				error,
			},
			"Failed to retrieve standalone events",
		);
		throw error;
	}
}

/**
 * Retrieves standalone events (and optionally recurring templates) by a list of specific IDs.
 * This function is designed for the `eventsByIds` query. By default, only standalone events
 * (not recurring templates or instances) are returned. When `options.includeTemplates` is true,
 * recurring event templates matching the IDs are also included.
 *
 * @param eventIds - An array of event IDs to retrieve.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @param options - Optional. `includeTemplates`: when true, includes recurring event templates in the result; default false.
 * @returns - A promise that resolves to an array of the requested event objects, including their attachments.
 */
export async function getStandaloneEventsByIds(
	eventIds: string[],
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
	options?: { includeTemplates?: boolean },
): Promise<
	(typeof eventsTable.$inferSelect & {
		attachments: (typeof eventAttachmentsTable.$inferSelect)[];
	})[]
> {
	// Early return for empty array to avoid inArray with empty list
	if (eventIds.length === 0) {
		return [];
	}

	try {
		const includeTemplates = options?.includeTemplates ?? false;
		const whereClause = includeTemplates
			? inArray(eventsTable.id, eventIds)
			: and(
					inArray(eventsTable.id, eventIds),
					eq(eventsTable.isRecurringEventTemplate, false),
				);

		const standaloneEvents: (typeof eventsTable.$inferSelect & {
			attachmentsWhereEvent: (typeof eventAttachmentsTable.$inferSelect)[];
		})[] = await drizzleClient.query.eventsTable.findMany({
			where: whereClause,
			with: {
				attachmentsWhereEvent: true,
			},
		});

		// Transform to include attachments in expected format
		const eventsWithAttachments = standaloneEvents.map(
			({ attachmentsWhereEvent, ...event }) => ({
				...event,
				attachments: attachmentsWhereEvent || [],
			}),
		);

		logger.debug(
			{
				requestedIds: eventIds.length,
				foundEvents: eventsWithAttachments.length,
			},
			"Retrieved standalone events by IDs",
		);

		return eventsWithAttachments;
	} catch (error) {
		logger.error(
			{
				eventIds,
				error,
			},
			"Failed to retrieve standalone events by IDs",
		);
		throw error;
	}
}
