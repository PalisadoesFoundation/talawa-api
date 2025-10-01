import type { eventVolunteerGroupsTable } from "~/src/drizzle/tables/EventVolunteerGroup";
import { builder } from "~/src/graphql/builder";

export type EventVolunteerGroup =
	typeof eventVolunteerGroupsTable.$inferSelect & {
		isInstanceException?: boolean;
	};

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

		/**
		 * Boolean indicating if this is a template volunteer group (for recurring events).
		 */
		isTemplate: t.exposeBoolean("isTemplate", {
			description:
				"Boolean indicating if this is a template volunteer group (for recurring events).",
		}),

		/**
		 * Indicates whether this volunteer group is currently showing instance-specific exception data.
		 */
		isInstanceException: t.field({
			type: "Boolean",
			description:
				"Indicates whether this volunteer group is currently showing instance-specific exception data.",
			resolve: (parent) => {
				// This field will be set by the resolver when exceptions are applied
				return Boolean(
					(parent as { isInstanceException?: boolean }).isInstanceException,
				);
			},
		}),
	}),
});
