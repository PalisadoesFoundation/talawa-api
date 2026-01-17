import type { ResolvedRecurringEventInstance as RecurringEventInstance } from "~/src/drizzle/tables/recurringEventInstances";
import type { EventWithAttachments } from "~/src/graphql/types/Query/eventQueries";

/**
 * Maps a recurring event instance to the internal unified EventWithAttachments format.
 * This is used to treat materialized instances like regular events in queries.
 *
 * @param instance - The raw recurring event instance
 * @returns The instance mapped to an EventWithAttachments structure
 */
export function mapRecurringInstanceToEvent(
	instance: RecurringEventInstance,
): EventWithAttachments {
	return {
		id: instance.id,
		name: instance.name,
		description: instance.description,
		startAt: instance.actualStartTime,
		endAt: instance.actualEndTime,
		location: instance.location,
		allDay: instance.allDay,
		isPublic: instance.isPublic,
		isRegisterable: instance.isRegisterable,
		isInviteOnly: instance.isInviteOnly,
		organizationId: instance.organizationId,
		creatorId: instance.creatorId,
		updaterId: instance.updaterId,
		createdAt: instance.createdAt,
		updatedAt: instance.updatedAt,
		isRecurringEventTemplate: false,
		baseRecurringEventId: instance.baseRecurringEventId,
		sequenceNumber: instance.sequenceNumber,
		totalCount: instance.totalCount,
		hasExceptions: instance.hasExceptions,
		attachments: [],
		eventType: "generated" as const,
		isGenerated: true,
	};
}
