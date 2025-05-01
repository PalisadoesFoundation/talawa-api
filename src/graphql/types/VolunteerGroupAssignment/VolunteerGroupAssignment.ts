import type { volunteerGroupAssignmentsTable } from "~/src/drizzle/tables/volunteerGroupAssignments";
import { builder } from "~/src/graphql/builder";

export type VolunteerGroupAssignments =
	typeof volunteerGroupAssignmentsTable.$inferSelect;

export const VolunteerGroupAssignments =
	builder.objectRef<VolunteerGroupAssignments>("VolunteerGroupAssignments");

VolunteerGroupAssignments.implement({
	description: "Assign Volunteers to a specific group for an event.",
	fields: (t) => ({
		inviteStatus: t.exposeString("inviteStatus", {
			description: "Invitation status.",
		}),
	}),
});
