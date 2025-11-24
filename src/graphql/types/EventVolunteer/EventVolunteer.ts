import type { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { builder } from "~/src/graphql/builder";

export type EventVolunteer = typeof eventVolunteersTable.$inferSelect & {
	isInstanceException?: boolean;
};

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

		/**
		 * Boolean indicating if this is a template volunteer (for recurring events).
		 */
		isTemplate: t.exposeBoolean("isTemplate", {
			description:
				"Boolean indicating if this is a template volunteer (for recurring events).",
		}),

		isInstanceException: t.field({
			type: "Boolean",
			description:
				"Indicates whether this volunteer is currently showing instance-specific exception data.",
			resolve: (parent) => {
				// This field will be set by the resolver when exceptions are applied
				return Boolean(
					(parent as { isInstanceException?: boolean }).isInstanceException,
				);
			},
		}),
	}),
});
