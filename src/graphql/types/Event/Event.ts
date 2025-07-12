import type { eventsTable } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import {
	EventAttachment,
	type EventAttachment as EventAttachmentType,
} from "~/src/graphql/types/EventAttachment/EventAttachment";
import type { VirtualEventInstance } from "~/src/utilities/recurringEventHelpers";

export type Event = (typeof eventsTable.$inferSelect | VirtualEventInstance) & {
	attachments: EventAttachmentType[] | null;
};

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
		endAt: t.expose("endAt", {
			description: "Date time at the time the event ends at.",
			type: "DateTime",
		}),
		id: t.exposeID("id", {
			description:
				"Global identifier of the event. For recurring instances, this is a virtual ID.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the event.",
		}),
		startAt: t.expose("startAt", {
			description: "Date time at the time the event starts at.",
			type: "DateTime",
			nullable: false,
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
		isRecurringTemplate: t.exposeBoolean("isRecurringTemplate", {
			description:
				"Indicates if this event is a recurring template (base event).",
		}),
		recurringEventId: t.exposeID("recurringEventId", {
			description: "ID of the base recurring event if this is an instance.",
		}),
		instanceStartTime: t.expose("instanceStartTime", {
			description: "Original start time for this recurring instance.",
			type: "DateTime",
		}),
		// Virtual instance metadata
		isVirtualInstance: t.boolean({
			description:
				"Indicates if this is a virtual instance generated from a recurring event.",
			resolve: (event) => {
				// Check if this is a virtual instance
				return !!(event as VirtualEventInstance).isVirtualInstance;
			},
		}),
		baseEventId: t.id({
			description: "Base event ID for virtual instances.",
			resolve: (event) => {
				const virtualEvent = event as VirtualEventInstance;
				return virtualEvent.baseEventId || null;
			},
		}),
		hasExceptions: t.boolean({
			description: "Indicates if this virtual instance has exceptions applied.",
			resolve: (event) => {
				const virtualEvent = event as VirtualEventInstance;
				return virtualEvent.hasExceptions || false;
			},
		}),
	}),
});
