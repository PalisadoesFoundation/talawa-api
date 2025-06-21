import { z } from "zod";
import { volunteerGroupAssignmentsTableInsertSchema } from "~/src/drizzle/tables/volunteerGroupAssignments";
import { builder } from "~/src/graphql/builder";

export const queryVolunteerGroupAssignmentsInputSchema = z.object({
	groupId: volunteerGroupAssignmentsTableInsertSchema.shape.groupId,
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
				required: true,
			}),
		}),
	});
