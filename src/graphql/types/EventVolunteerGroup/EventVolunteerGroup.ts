import type { eventVolunteerGroupsTable } from "~/src/drizzle/tables/EventVolunteerGroup";
import { builder } from "~/src/graphql/builder";

export type EventVolunteerGroup = typeof eventVolunteerGroupsTable.$inferSelect;

/**
 * GraphQL object reference for EventVolunteerGroup.
 */
export const EventVolunteerGroup = builder.objectRef<EventVolunteerGroup>(
	"EventVolunteerGroup",
);

/**
 * GraphQL object type implementation for EventVolunteerGroup.
 * Represents a volunteer group for a specific event with a leader.
 */
EventVolunteerGroup.implement({
	description:
		"Represents a volunteer group for a specific event with a leader.",
	fields: (t) => ({
		/**
		 * Primary unique identifier of the event volunteer group.
		 */
		id: t.exposeID("id", {
			description: "Primary unique identifier of the event volunteer group.",
		}),

		/**
		 * Name of the volunteer group.
		 */
		name: t.exposeString("name", {
			description: "Name of the volunteer group.",
		}),

		/**
		 * Description of the volunteer group.
		 */
		description: t.exposeString("description", {
			description: "Description of the volunteer group.",
			nullable: true,
		}),

		/**
		 * Number of volunteers required for this group.
		 */
		volunteersRequired: t.exposeInt("volunteersRequired", {
			description: "Number of volunteers required for this group.",
			nullable: true,
		}),
	}),
});
