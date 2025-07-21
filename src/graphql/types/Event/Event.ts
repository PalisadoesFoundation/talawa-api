import type { eventsTable } from "~/src/drizzle/tables/events";
import type { ResolvedRecurringEventInstance } from "~/src/drizzle/tables/recurringEventInstances";
import { builder } from "~/src/graphql/builder";
import {
	EventAttachment,
	type EventAttachment as EventAttachmentType,
} from "~/src/graphql/types/EventAttachment/EventAttachment";

// Unified Event type supporting both standalone events and materialized instances
export type Event =
	| (typeof eventsTable.$inferSelect & { attachments: EventAttachmentType[] })
	| (ResolvedRecurringEventInstance & {
			attachments: EventAttachmentType[];
	  });

export const Event = builder.objectRef<Event>("Event");

Event.implement({
	description:
		"Represents an event, which can be a standalone occurrence or a materialized instance of a recurring series. This unified type allows for consistent handling of all events.",
	fields: (t) => ({
		attachments: t.expose("attachments", {
			description:
				"A list of attachments associated with the event, such as images or documents.",
			type: t.listRef(EventAttachment),
		}),
		description: t.exposeString("description", {
			description:
				"A detailed description of the event, providing custom information and context.",
		}),
		endAt: t.field({
			description:
				"The date and time when the event is scheduled to end. For materialized instances, this reflects the actual end time if modified.",
			type: "DateTime",
			resolve: (event) =>
				"actualEndTime" in event ? event.actualEndTime : event.endAt,
		}),
		id: t.exposeID("id", {
			description:
				"The unique global identifier for the event. For recurring instances, this ID refers to the specific materialized instance.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "The name or title of the event.",
		}),
		startAt: t.field({
			description:
				"The date and time when the event is scheduled to start. For materialized instances, this reflects the actual start time if modified.",
			type: "DateTime",
			nullable: false,
			resolve: (event) =>
				"actualStartTime" in event ? event.actualStartTime : event.startAt,
		}),
		allDay: t.exposeBoolean("allDay", {
			description:
				"A boolean flag indicating if the event lasts for the entire day.",
		}),
		isPublic: t.exposeBoolean("isPublic", {
			description:
				"A boolean flag indicating if the event is visible to the public.",
		}),
		isRegisterable: t.exposeBoolean("isRegisterable", {
			description:
				"A boolean flag indicating if users can register for this event.",
		}),
		location: t.exposeString("location", {
			description:
				"The physical or virtual location where the event will take place.",
		}),
		isRecurringEventTemplate: t.boolean({
			description:
				"A boolean flag indicating if this event serves as a template for a recurring series.",
			resolve: (event) =>
				"isRecurringEventTemplate" in event && event.isRecurringEventTemplate,
		}),
		baseRecurringEvent: t.field({
			description:
				"The base recurring event template if this is a materialized instance.",
			type: Event,
			nullable: true,
			resolve: async (event, args, { drizzleClient }) => {
				const recurringEventId =
					"recurringEventId" in event ? event.recurringEventId : null;
				if (recurringEventId) {
					const baseEvent = await drizzleClient.query.eventsTable.findFirst({
						where: (fields, { eq }) => eq(fields.id, recurringEventId),
					});
					if (baseEvent) {
						return { ...baseEvent, attachments: [] };
					}
				}
				return null;
			},
		}),
		instanceStartTime: t.field({
			description:
				"The original start time of this instance as defined by the recurrence rule.",
			type: "DateTime",
			resolve: (event) =>
				"instanceStartTime" in event ? event.instanceStartTime : null,
		}),
		isMaterialized: t.boolean({
			description:
				"A boolean flag indicating if this event is a materialized instance of a recurring event.",
			resolve: (event) => "baseRecurringEventId" in event,
		}),
		baseEvent: t.field({
			description:
				"The base event from which this materialized instance was generated.",
			type: Event,
			nullable: true,
			resolve: async (event, args, { drizzleClient }) => {
				const baseRecurringEventId =
					"baseRecurringEventId" in event ? event.baseRecurringEventId : null;
				if (baseRecurringEventId) {
					const baseEvent = await drizzleClient.query.eventsTable.findFirst({
						where: (fields, { eq }) => eq(fields.id, baseRecurringEventId),
					});
					if (baseEvent) {
						return { ...baseEvent, attachments: [] };
					}
				}
				return null;
			},
		}),
		hasExceptions: t.boolean({
			description:
				"A boolean flag indicating if this materialized instance has any exceptions applied to it.",
			resolve: (event) => "hasExceptions" in event && event.hasExceptions,
		}),
		sequenceNumber: t.int({
			description:
				"The sequence number of this instance within its recurring series (e.g., 1, 2, 3, ...).",
			resolve: (event) =>
				"sequenceNumber" in event ? event.sequenceNumber : null,
		}),
		totalCount: t.int({
			description:
				"The total number of instances in the complete recurring series. This will be null for infinite series.",
			resolve: (event) => ("totalCount" in event ? event.totalCount : null),
		}),
		progressLabel: t.string({
			description:
				"A human-readable label indicating the progress of this instance in the series, such as '5 of 12' or 'Episode #7'.",
			resolve: (event) => {
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
