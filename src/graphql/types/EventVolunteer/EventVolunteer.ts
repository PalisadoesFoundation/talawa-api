import type { eventVolunteersTable } from "~/src/drizzle/tables/EventVolunteer";
import { builder } from "~/src/graphql/builder";

export type EventVolunteer = typeof eventVolunteersTable.$inferSelect;

/**
 * GraphQL object reference for EventVolunteer.
 */
export const EventVolunteer =
	builder.objectRef<EventVolunteer>("EventVolunteer");

/**
 * GraphQL object type implementation for EventVolunteer.
 * Represents an individual volunteer for a specific event.
 */
EventVolunteer.implement({
	description: "Represents an individual volunteer for a specific event.",
	fields: (t) => ({
		/**
		 * Primary unique identifier of the event volunteer.
		 */
		id: t.exposeID("id", {
			description: "Primary unique identifier of the event volunteer.",
		}),

		/**
		 * Boolean indicating if the volunteer has accepted the invitation.
		 */
		hasAccepted: t.exposeBoolean("hasAccepted", {
			description:
				"Boolean indicating if the volunteer has accepted the invitation.",
		}),

		/**
		 * Boolean indicating if the volunteer profile is public.
		 */
		isPublic: t.exposeBoolean("isPublic", {
			description: "Boolean indicating if the volunteer profile is public.",
		}),

		/**
		 * Total hours volunteered by this volunteer for this event.
		 */
		hoursVolunteered: t.field({
			type: "Float",
			description: "Total hours volunteered by this volunteer for this event.",
			resolve: (parent) => Number.parseFloat(parent.hoursVolunteered),
		}),
	}),
});
