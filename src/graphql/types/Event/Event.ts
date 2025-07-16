import type { eventsTable } from "~/src/drizzle/tables/events";
import type { ResolvedMaterializedEventInstance } from "~/src/drizzle/tables/materializedEventInstances";
import { builder } from "~/src/graphql/builder";
import {
	EventAttachment,
	type EventAttachment as EventAttachmentType,
} from "~/src/graphql/types/EventAttachment/EventAttachment";

// Unified Event type supporting both standalone events and materialized instances
export type Event =
	| (typeof eventsTable.$inferSelect & { attachments: EventAttachmentType[] })
	| (ResolvedMaterializedEventInstance & {
			attachments: EventAttachmentType[];
	  });

export const Event = builder.objectRef<Event>("Event");

Event.implement({
	description:
		"Events are occurrences that take place for specific purposes at specific times. Can be standalone events or instances of recurring events.",
	fields: (t) => ({
		attachments: t.expose("attachments", {
			description: "Array of attachments.",
			type: t.listRef(EventAttachment),
		}),
		description: t.exposeString("description", {
			description: "Custom information about the event.",
		}),
		endAt: t.field({
			description: "Date time at the time the event ends at.",
			type: "DateTime",
			resolve: (event) =>
				"actualEndTime" in event ? event.actualEndTime : event.endAt,
		}),
		id: t.exposeID("id", {
			description:
				"Global identifier of the event. For recurring instances, this is the materialized instance ID.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the event.",
		}),
		startAt: t.field({
			description: "Date time at the time the event starts at.",
			type: "DateTime",
			nullable: false,
			resolve: (event) =>
				"actualStartTime" in event ? event.actualStartTime : event.startAt,
		}),
		allDay: t.exposeBoolean("allDay", {
			description: "Indicates if the event spans the entire day.",
		}),
		isPublic: t.exposeBoolean("isPublic", {
			description: "Indicates if the event is publicly visible.",
		}),
		isRegisterable: t.exposeBoolean("isRegisterable", {
			description: "Indicates if users can register for this event.",
		}),
		location: t.exposeString("location", {
			description: "Physical or virtual location of the event.",
		}),
		// Recurring event fields
		isRecurringTemplate: t.boolean({
			description:
				"Indicates if this event is a recurring template (base event).",
			resolve: (event) =>
				"isRecurringTemplate" in event && event.isRecurringTemplate,
		}),
		recurringEventId: t.id({
			description: "ID of the base recurring event if this is an instance.",
			resolve: (event) =>
				"recurringEventId" in event ? event.recurringEventId : null,
		}),
		instanceStartTime: t.field({
			description: "Original start time for this recurring instance.",
			type: "DateTime",
			resolve: (event) =>
				"instanceStartTime" in event ? event.instanceStartTime : null,
		}),
		// Simplified metadata - no more virtual instance complexity
		isMaterialized: t.boolean({
			description:
				"Indicates if this is a materialized instance from a recurring event.",
			resolve: (event) => {
				// Check if this has materialization metadata
				return "baseRecurringEventId" in event;
			},
		}),
		baseEventId: t.id({
			description: "Base event ID for materialized instances.",
			resolve: (event) => {
				// For materialized instances, return the base recurring event ID
				if ("baseRecurringEventId" in event) {
					return event.baseRecurringEventId;
				}
				return null;
			},
		}),
		hasExceptions: t.boolean({
			description:
				"Indicates if this materialized instance has exceptions applied.",
			resolve: (event) => {
				// For materialized instances, check if exceptions were applied
				if ("hasExceptions" in event) {
					return event.hasExceptions;
				}
				return false;
			},
		}),
		// NEW: Sequence metadata fields
		sequenceNumber: t.int({
			description:
				"Sequence number of this instance in the recurring series (1, 2, 3, ...).",
			resolve: (event) => {
				// For materialized instances, return sequence number
				if ("sequenceNumber" in event) {
					return event.sequenceNumber;
				}
				return null;
			},
		}),
		totalCount: t.int({
			description:
				"Total count of instances in the complete recurring series. Null for infinite series.",
			resolve: (event) => {
				// For materialized instances, return total count
				if ("totalCount" in event) {
					return event.totalCount;
				}
				return null;
			},
		}),
		progressLabel: t.string({
			description:
				"Human-readable progress label like '5 of 12' or 'Episode #7'.",
			resolve: (event) => {
				// For materialized instances, create progress label
				if ("sequenceNumber" in event && "totalCount" in event) {
					const sequence = event.sequenceNumber;
					const total = event.totalCount;

					if (total) {
						return `${sequence} of ${total}`;
					}
					return `#${sequence}`;
				}
				return null;
			},
		}),
	}),
});
