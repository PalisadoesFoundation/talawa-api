import type { volunteerGroupsTable } from "~/src/drizzle/tables/volunteerGroups";
import { builder } from "~/src/graphql/builder";

export type VolunteerGroups = typeof volunteerGroupsTable.$inferSelect;

export const VolunteerGroups =
	builder.objectRef<VolunteerGroups>("VolunteerGroups");

VolunteerGroups.implement({
	description:
		"Volunteer Groups are created for events for members to perform various activities.",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Global identifier of the group.",
			nullable: false,
		}),
		maxVolunteerCount: t.exposeInt("maxVolunteerCount", {
			description: "Maximum number of volunteers for this group.",
		}),
		name: t.exposeString("name", {
			description: "Name of the Group.",
		}),
	}),
});
