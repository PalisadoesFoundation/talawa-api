import type { z } from "zod";
import { volunteerGroupAssignmentInviteStatusEnum } from "~/src/drizzle/enums/volunteerGroupAssignmentInviteStatus";
import { volunteerGroupAssignmentsTableInsertSchema } from "~/src/drizzle/tables/volunteerGroupAssignments";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateVolunteerGroupAssignmentsInputSchema =
	volunteerGroupAssignmentsTableInsertSchema.pick({
		assigneeId: true,
		groupId: true,
		inviteStatus: true,
	});

const InviteStatusEnum = builder.enumType("UpdateInviteStatus", {
	values: volunteerGroupAssignmentInviteStatusEnum.options,
});

export const MutationUpdateVolunteerGroupAssignmentsInput = builder
	.inputRef<z.infer<typeof mutationUpdateVolunteerGroupAssignmentsInputSchema>>(
		"MutationUpdateVolunteerGroupAssignmentsInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			assigneeId: t.id({
				description: "Global identifier of the user.",
				required: true,
			}),
			inviteStatus: t.field({
				description: "Invitation Status.",
				type: InviteStatusEnum,
				required: true,
			}),
			groupId: t.id({
				description: "Global identifier of the group.",
				required: true,
			}),
		}),
	});
