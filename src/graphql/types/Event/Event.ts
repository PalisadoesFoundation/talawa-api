import type { eventsTable } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import {
	EventAttachment,
	type EventAttachment as EventAttachmentType,
} from "~/src/graphql/types/EventAttachment/EventAttachment";
import { AgendaItem } from "../AgendaItem/AgendaItem";
import { resolveAgendaItems } from "./agendaItems";

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
		agendaItems: t.field({
			type: [AgendaItem],
			description:
				"A flattened list of all agenda items for the event, across all folders.",
			resolve: resolveAgendaItems,
		}),
	}),
});
