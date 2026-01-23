import type { InferSelectModel } from "drizzle-orm";
import { and, eq, inArray, or } from "drizzle-orm";
import type { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import type { eventsTable } from "~/src/drizzle/tables/events";
import { mapRecurringInstanceToEvent } from "~/src/graphql/utils/mapRecurringInstanceToEvent";
import type { ServiceDependencies } from "~/src/services/eventGeneration/types";
import {
	type GetRecurringEventInstancesInput,
	getRecurringEventInstancesByIds,
	getRecurringEventInstancesInDateRange,
} from "./recurringEventInstanceQueries";
import {
	type GetStandaloneEventsInput,
	getStandaloneEventsByIds,
	getStandaloneEventsInDateRange,
} from "./standaloneEventQueries";

/**
 * Represents a unified event object that includes attachments and metadata
 * to distinguish between standalone and generated events.
 */
export type EventWithAttachments = InferSelectModel<typeof eventsTable> & {
	attachments: (typeof eventAttachmentsTable.$inferSelect)[];
	eventType: "standalone" | "generated";
	isGenerated?: boolean;
	baseRecurringEventId?: string;
	sequenceNumber?: number;
	totalCount?: number | null;
	hasExceptions?: boolean;
};

/**
 * Defines the input parameters for querying a unified list of events,
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
 * Parameters for filtering events based on invite-only visibility rules.
 */
export interface FilterInviteOnlyEventsInput {
	events: EventWithAttachments[];
	currentUserId: string;
	currentUserRole: string;
	/**
	 * Either a single organization membership (for single-org queries) or
	 * a map of organization IDs to memberships (for cross-org queries).
	 * If a map is provided, it will be used to look up membership per event.
	 */
	currentUserOrgMembership:
		| { role: string }
		| undefined
		| Map<string, { role: string } | undefined>;
	drizzleClient: ServiceDependencies["drizzleClient"];
}

/**
 * Filters invite-only events based on visibility rules.
 * An invite-only event is only visible to:
 * 1. The event creator
 * 2. Organization admins
 * 3. Users explicitly invited to the event
 *
 * @param input - The input object containing events and user context.
 * @returns - A filtered array of events that the user can view.
 */
export async function filterInviteOnlyEvents(
	input: FilterInviteOnlyEventsInput,
): Promise<EventWithAttachments[]> {
	const {
		events,
		currentUserId,
		currentUserRole,
		currentUserOrgMembership,
		drizzleClient,
	} = input;

	// Helper to get organization membership for an event
	const getOrgMembership = (
		organizationId: string,
	): { role: string } | undefined => {
		if (currentUserOrgMembership instanceof Map) {
			return currentUserOrgMembership.get(organizationId);
		}
		return currentUserOrgMembership;
	};

	// Separate invite-only events from public events
	const inviteOnlyEvents: EventWithAttachments[] = [];
	const publicEvents: EventWithAttachments[] = [];

	for (const event of events) {
		if (event.isInviteOnly) {
			inviteOnlyEvents.push(event);
		} else {
			publicEvents.push(event);
		}
	}

	// If no invite-only events, return all events
	if (inviteOnlyEvents.length === 0) {
		return events;
	}

	// Check which invite-only events the user can view
	const visibleInviteOnlyEvents: EventWithAttachments[] = [];

	// Batch check invitations for all invite-only events
	const standaloneEventIds: string[] = [];
	const recurringInstanceIds: string[] = [];

	for (const event of inviteOnlyEvents) {
		// Check if user is creator
		if (event.creatorId === currentUserId) {
			visibleInviteOnlyEvents.push(event);
			continue;
		}

		// Check if user is admin (global or org admin for this event's org)
		const eventOrgMembership = getOrgMembership(event.organizationId);
		if (
			currentUserRole === "administrator" ||
			eventOrgMembership?.role === "administrator"
		) {
			visibleInviteOnlyEvents.push(event);
			continue;
		}

		// Collect event IDs for batch invitation check
		if (event.eventType === "standalone") {
			standaloneEventIds.push(event.id);
		} else {
			recurringInstanceIds.push(event.id);
		}
	}

	// Batch check invitations and registrations for standalone events
	if (standaloneEventIds.length > 0) {
		const standaloneAttendees =
			await drizzleClient.query.eventAttendeesTable.findMany({
				columns: {
					eventId: true,
				},
				where: and(
					eq(eventAttendeesTable.userId, currentUserId),
					or(
						eq(eventAttendeesTable.isInvited, true),
						eq(eventAttendeesTable.isRegistered, true),
					),
					inArray(eventAttendeesTable.eventId, standaloneEventIds),
				),
			});

		const accessibleEventIds = new Set(
			(standaloneAttendees ?? [])
				.map((inv) => inv.eventId)
				.filter(Boolean) as string[],
		);

		for (const event of inviteOnlyEvents) {
			if (
				event.eventType === "standalone" &&
				accessibleEventIds.has(event.id) &&
				!visibleInviteOnlyEvents.some((e) => e.id === event.id)
			) {
				visibleInviteOnlyEvents.push(event);
			}
		}
	}

	// Batch check invitations and registrations for recurring instances
	if (recurringInstanceIds.length > 0) {
		const recurringAttendees =
			await drizzleClient.query.eventAttendeesTable.findMany({
				columns: {
					recurringEventInstanceId: true,
				},
				where: and(
					eq(eventAttendeesTable.userId, currentUserId),
					or(
						eq(eventAttendeesTable.isInvited, true),
						eq(eventAttendeesTable.isRegistered, true),
					),
					inArray(
						eventAttendeesTable.recurringEventInstanceId,
						recurringInstanceIds,
					),
				),
			});

		const accessibleInstanceIds = new Set(
			(recurringAttendees ?? [])
				.map((inv) => inv.recurringEventInstanceId)
				.filter(Boolean) as string[],
		);

		for (const event of inviteOnlyEvents) {
			if (
				event.eventType === "generated" &&
				accessibleInstanceIds.has(event.id) &&
				!visibleInviteOnlyEvents.some((e) => e.id === event.id)
			) {
				visibleInviteOnlyEvents.push(event);
			}
		}
	}

	// Combine public events with visible invite-only events
	return [...publicEvents, ...visibleInviteOnlyEvents];
}

/**
 * Retrieves a unified list of events, including both standalone events and generated
 * instances of recurring events, within a specified date range. This is the primary function
 * used by the `organization.events` GraphQL resolver.
 *
 * @param input - The input object containing organizationId, date range, and optional filters.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns - A promise that resolves to a sorted array of unified event objects.
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

		// Step 1: Get standalone events - use requested limit
		const standaloneEventsInput: GetStandaloneEventsInput = {
			organizationId,
			startDate,
			endDate,
			limit: limit,
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
			})),
		);

		// Step 2: Get generated instances (if recurring events are included)
		if (includeRecurring) {
			const generatedInstancesInput: GetRecurringEventInstancesInput = {
				organizationId,
				startDate,
				endDate,
				includeCancelled: false,
				limit: limit,
			};

			const generatedInstances = await getRecurringEventInstancesInDateRange(
				generatedInstancesInput,
				drizzleClient,
				logger,
			);

			// Transform generated instances to unified format
			const enrichedGeneratedInstances: EventWithAttachments[] =
				generatedInstances.map(mapRecurringInstanceToEvent);

			allEvents.push(...enrichedGeneratedInstances);
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

		// Step 4: Apply final limit after sorting - this ensures we get the earliest events regardless of type
		if (allEvents.length > limit) {
			allEvents = allEvents.slice(0, limit);
		}

		return allEvents;
	} catch (error) {
		logger.error(
			{
				organizationId,
				error,
			},
			"Failed to get unified events",
		);
		throw error;
	}
}

/**
 * Retrieves events by their specific IDs, supporting both standalone events and
 * generated instances in a single, unified query. This function is used by the
 * `eventsByIds` GraphQL query to fetch a mixed list of event types.
 *
 * @param eventIds - An array of event IDs to retrieve.
 * @param drizzleClient - The Drizzle ORM client for database access.
 * @param logger - The logger for logging debug and error messages.
 * @returns - A promise that resolves to an array of the requested event objects,
 *          unified into a common format.
 */
export async function getEventsByIds(
	eventIds: string[],
	drizzleClient: ServiceDependencies["drizzleClient"],
	logger: ServiceDependencies["logger"],
): Promise<EventWithAttachments[]> {
	try {
		const events: EventWithAttachments[] = [];

		// Step 1: Try to get standalone events (and templates if they are requested by ID)
		// We include templates here so that we can expand them later or display them if needed
		const standaloneEvents = await getStandaloneEventsByIds(
			eventIds,
			drizzleClient,
			logger,
			{ includeTemplates: true },
		);

		// Add standalone events to results
		events.push(
			...standaloneEvents.map((event) => ({
				...event,
				eventType: "standalone" as const,
				isGenerated: false,
			})),
		);

		// Step 2: Get remaining IDs that weren't found as standalone events
		const foundStandaloneIds = new Set(standaloneEvents.map((e) => e.id));
		const remainingIds = eventIds.filter((id) => !foundStandaloneIds.has(id));

		// Step 3: Get all generated instances for the remaining IDs in a single batch
		if (remainingIds.length > 0) {
			const resolvedInstances = await getRecurringEventInstancesByIds(
				remainingIds,
				drizzleClient,
				logger,
			);

			const generatedEvents: EventWithAttachments[] = resolvedInstances.map(
				mapRecurringInstanceToEvent,
			);
			events.push(...generatedEvents);
		}

		logger.debug(
			{
				requestedIds: eventIds.length,
				foundStandalone: standaloneEvents.length,
				foundGenerated: events.length - standaloneEvents.length,
				totalFound: events.length,
			},
			"Retrieved events by IDs",
		);

		return events;
	} catch (error) {
		logger.error(
			{
				eventIds,
				error,
			},
			"Failed to get events by IDs",
		);
		throw error;
	}
}
