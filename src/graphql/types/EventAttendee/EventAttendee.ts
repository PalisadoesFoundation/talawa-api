import type { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { builder } from "~/src/graphql/builder";

export type EventAttendee = typeof eventAttendeesTable.$inferSelect;

export const EventAttendee = builder.objectRef<EventAttendee>("EventAttendee");

EventAttendee.implement({
	description: "Represents an event attendee record.",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Global identifier of the event attendee.",
			nullable: false,
		}),
		isInvited: t.exposeBoolean("isInvited", {
			description: "Indicates if the attendee is invited to the event.",
			nullable: false,
		}),
		isRegistered: t.exposeBoolean("isRegistered", {
			description: "Indicates if the attendee is registered for the event.",
			nullable: false,
		}),
		isCheckedIn: t.exposeBoolean("isCheckedIn", {
			description: "Indicates if the attendee has checked in to the event.",
			nullable: false,
		}),
		isCheckedOut: t.exposeBoolean("isCheckedOut", {
			description: "Indicates if the attendee has checked out from the event.",
			nullable: false,
		}),
	}),
});
