import type { InferSelectModel } from "drizzle-orm";
import type { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import type { eventsTable } from "~/src/drizzle/tables/events";
import type { ServiceDependencies } from "~/src/services/eventInstanceMaterialization/types";
import {
	type GetMaterializedInstancesInput,
	getMaterializedInstancesByIds,
	getMaterializedInstancesInDateRange,
} from "./materializedInstanceQueries";
import {
	type GetStandaloneEventsInput,
	getStandaloneEventsByIds,
	getStandaloneEventsInDateRange,
} from "./standaloneEventQueries";

/**
 * @description Represents a unified event object that includes attachments and metadata
 * to distinguish between standalone and materialized events.
 */
export type EventWithAttachments = InferSelectModel<typeof eventsTable> & {
	attachments: (typeof eventAttachmentsTable.$inferSelect)[];
	eventType: "standalone" | "materialized";
	isMaterialized?: boolean;
	baseRecurringEventId?: string;
	sequenceNumber?: number;
	totalCount?: number | null;
	hasExceptions?: boolean;
};

/**
 * @description Defines the input parameters for querying a unified list of events,
 * including both standalone and recurring instances.
 */
export interface GetUnifiedEventsInput {
	organizationId: string;
	startDate: Date;
	endDate: Date;
	includeRecurring?: boolean;
	limit?: number;
}

/**
 * Retrieves a unified list of events, including both standalone events and materialized
 * instances of recurring events, within a specified date range. This is the primary function
 * used by the `organization.events` GraphQL resolver.
 *
 * @param input - The input object containing organizationId, date range, and optional filters.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns A promise that resolves to a sorted array of unified event objects.
 */
export async function getUnifiedEventsInDateRange(
	input: GetUnifiedEventsInput,
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<EventWithAttachments[]> {
	const {
		organizationId,
		startDate,
		endDate,
		includeRecurring = true,
		limit = 1000,
	} = input;

	try {
		let allEvents: EventWithAttachments[] = [];

		// Step 1: Get standalone events
		const standaloneEventsInput: GetStandaloneEventsInput = {
			organizationId,
			startDate,
			endDate,
			limit: Math.floor(limit * 0.6), // Reserve 60% of limit for standalone events
		};

		const standaloneEvents = await getStandaloneEventsInDateRange(
			standaloneEventsInput,
			drizzleClient,
			logger,
		);

		// Transform standalone events to unified format
		allEvents.push(
			...standaloneEvents.map((event) => ({
				...event,
				eventType: "standalone" as const,
				isMaterialized: false,
			})),
		);

		// Step 2: Get materialized instances (if recurring events are included)
		if (includeRecurring) {
			const materializedInstancesInput: GetMaterializedInstancesInput = {
				organizationId,
				startDate,
				endDate,
				includeCancelled: false,
				limit: Math.floor(limit * 0.4), // Reserve 40% of limit for materialized instances
			};

			const materializedInstances = await getMaterializedInstancesInDateRange(
				materializedInstancesInput,
				drizzleClient,
				logger,
			);

			// Transform materialized instances to unified format
			const enrichedMaterializedInstances: EventWithAttachments[] =
				materializedInstances.map((instance) => ({
					// Core event properties (resolved from template + exceptions)
					id: instance.id, // Use materialized instance ID
					name: instance.name,
					description: instance.description,
					startAt: instance.actualStartTime,
					endAt: instance.actualEndTime,
					location: instance.location,
					allDay: instance.allDay,
					isPublic: instance.isPublic,
					isRegisterable: instance.isRegisterable,
					organizationId: instance.organizationId,
					creatorId: instance.creatorId,
					updaterId: instance.updaterId,
					createdAt: instance.createdAt,
					updatedAt: instance.updatedAt,

					// Materialized instance metadata
					isRecurringTemplate: false, // Instances are never templates
					recurringEventId: instance.baseRecurringEventId, // Reference to base template
					instanceStartTime: instance.originalInstanceStartTime, // Original scheduled time

					// Additional materialized properties
					baseRecurringEventId: instance.baseRecurringEventId,
					sequenceNumber: instance.sequenceNumber,
					totalCount: instance.totalCount,
					hasExceptions: instance.hasExceptions,
					isMaterialized: true,

					attachments: [],
					eventType: "materialized" as const,
				}));

			allEvents.push(...enrichedMaterializedInstances);
		}

		// Step 3: Sort all events by start time (and then by ID for consistency)
		allEvents.sort((a, b) => {
			const aTime = new Date(a.startAt).getTime();
			const bTime = new Date(b.startAt).getTime();
			if (aTime === bTime) {
				return a.id.localeCompare(b.id);
			}
			return aTime - bTime;
		});

		// Step 4: Apply final limit
		if (allEvents.length > limit) {
			allEvents = allEvents.slice(0, limit);
		}

		logger.debug("Retrieved unified events", {
			organizationId,
			standaloneCount: standaloneEvents.length,
			materializedCount: includeRecurring
				? allEvents.filter((e) => e.eventType === "materialized").length
				: 0,
			totalCount: allEvents.length,
			dateRange: {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			},
		});

		return allEvents;
	} catch (error) {
		logger.error("Failed to get unified events", {
			organizationId,
			error,
		});
		throw error;
	}
}

/**
 * Retrieves events by their specific IDs, supporting both standalone events and
 * materialized instances in a single, unified query. This function is used by the
 * `eventsByIds` GraphQL query to fetch a mixed list of event types.
 *
 * @param eventIds - An array of event IDs to retrieve.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns A promise that resolves to an array of the requested event objects,
 *          unified into a common format.
 */
export async function getEventsByIds(
	eventIds: string[],
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<EventWithAttachments[]> {
	try {
		const events: EventWithAttachments[] = [];

		// Step 1: Try to get standalone events
		const standaloneEvents = await getStandaloneEventsByIds(
			eventIds,
			drizzleClient,
			logger,
		);

		// Add standalone events to results
		events.push(
			...standaloneEvents.map((event) => ({
				...event,
				eventType: "standalone" as const,
				isMaterialized: false,
			})),
		);

		// Step 2: Get remaining IDs that weren't found as standalone events
		const foundStandaloneIds = new Set(standaloneEvents.map((e) => e.id));
		const remainingIds = eventIds.filter((id) => !foundStandaloneIds.has(id));

		// Step 3: Get all materialized instances for the remaining IDs in a single batch
		if (remainingIds.length > 0) {
			const resolvedInstances = await getMaterializedInstancesByIds(
				remainingIds,
				drizzleClient,
				logger,
			);

			const materializedEvents: EventWithAttachments[] = resolvedInstances.map(
				(resolvedInstance) => ({
					id: resolvedInstance.id,
					name: resolvedInstance.name,
					description: resolvedInstance.description,
					startAt: resolvedInstance.actualStartTime,
					endAt: resolvedInstance.actualEndTime,
					location: resolvedInstance.location,
					allDay: resolvedInstance.allDay,
					isPublic: resolvedInstance.isPublic,
					isRegisterable: resolvedInstance.isRegisterable,
					organizationId: resolvedInstance.organizationId,
					creatorId: resolvedInstance.creatorId,
					updaterId: resolvedInstance.updaterId,
					createdAt: resolvedInstance.createdAt,
					updatedAt: resolvedInstance.updatedAt,
					isRecurringTemplate: false,
					recurringEventId: resolvedInstance.baseRecurringEventId,
					instanceStartTime: resolvedInstance.originalInstanceStartTime,
					baseRecurringEventId: resolvedInstance.baseRecurringEventId,
					sequenceNumber: resolvedInstance.sequenceNumber,
					totalCount: resolvedInstance.totalCount,
					hasExceptions: resolvedInstance.hasExceptions,
					attachments: [], // TODO: Handle attachments for materialized instances
					eventType: "materialized" as const,
					isMaterialized: true,
				}),
			);
			events.push(...materializedEvents);
		}

		logger.debug("Retrieved events by IDs", {
			requestedIds: eventIds.length,
			foundStandalone: standaloneEvents.length,
			foundMaterialized: events.length - standaloneEvents.length,
			totalFound: events.length,
		});

		return events;
	} catch (error) {
		logger.error("Failed to get events by IDs", {
			eventIds,
			error,
		});
		throw error;
	}
}
