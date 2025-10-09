import type { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { builder } from "~/src/graphql/builder";

export type VolunteerMembership =
	typeof eventVolunteerMembershipsTable.$inferSelect;

/**
 * GraphQL object reference for VolunteerMembership.
 */
export const VolunteerMembership = builder.objectRef<VolunteerMembership>(
	"VolunteerMembership",
);

/**
 * GraphQL object type implementation for VolunteerMembership.
 * Represents the relationship between volunteers and volunteer groups.
 */
VolunteerMembership.implement({
	description:
		"Represents the relationship between volunteers and volunteer groups.",
	fields: (t) => ({
		/**
		 * Primary unique identifier of the volunteer membership.
		 */
		id: t.exposeID("id", {
			description: "Primary unique identifier of the volunteer membership.",
		}),

		/**
		 * Status of the volunteer membership.
		 */
		status: t.exposeString("status", {
			description:
				"Status of the volunteer membership (invited, requested, accepted, rejected).",
		}),
	}),
});
