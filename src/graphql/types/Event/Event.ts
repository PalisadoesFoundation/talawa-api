import type { eventsTable } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import {
	EventAttachment,
	type EventAttachment as EventAttachmentType,
} from "~/src/graphql/types/EventAttachment/EventAttachment";

export type Event = typeof eventsTable.$inferSelect & {
	attachments: EventAttachmentType[] | null;
};

export const Event = builder.objectRef<Event>("Event");

Event.implement({
	description:
		"Events are occurrences that take place for specific purposes at specific times.",
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
			description: "Global identifier of the event.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the event.",
		}),
		startAt: t.expose("startAt", {
			description: "Date time at the time the event starts at.",
			type: "DateTime",
		}),
	}),
});
