import { z } from "zod";
import { volunteerGroupAssignmentsTableInsertSchema } from "~/src/drizzle/tables/volunteerGroupAssignments";
import { volunteerGroupsTableInsertSchema } from "~/src/drizzle/tables/volunteerGroups";
import { builder } from "~/src/graphql/builder";

export const queryVolunteerGroupAssignmentsInputSchema = z.object({
	groupId: volunteerGroupAssignmentsTableInsertSchema.shape.groupId.optional(),
	eventId: volunteerGroupsTableInsertSchema.shape.eventId.optional(),
	assigneeId: volunteerGroupAssignmentsTableInsertSchema.shape.assigneeId.optional(),
});

export const QueryVolunteerGroupAssignmentsInput = builder
	.inputRef<z.infer<typeof queryVolunteerGroupAssignmentsInputSchema>>(
		"QueryVolunteerGroupAssignmentsInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			groupId: t.string({
				description: "Global id of the group.",
				required: false,
			}),
			eventId: t.string({
				description: "Global id of the event.",
				required: false,
			}),
			assigneeId: t.string({
				description: "Global id of the user.",
				required: false,
			}),
		}),
	});
