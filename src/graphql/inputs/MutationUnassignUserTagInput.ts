import type { z } from "zod";
import { tagAssignmentsTableInsertSchema } from "~/src/drizzle/tables/tagAssignments";
import { builder } from "~/src/graphql/builder";

export const mutationUnassignUserTagInputSchema =
	tagAssignmentsTableInsertSchema
		.pick({
			assigneeId: true,
			tagId: true,
		})
		.refine(
			({ assigneeId, tagId }) =>
				assigneeId !== undefined && tagId !== undefined,
			{
				message: "Both assigneeId and tagId must be provided.",
			},
		);

export const MutationUnassignUserTagInput = builder
	.inputRef<z.infer<typeof mutationUnassignUserTagInputSchema>>(
		"MutationUnassignUserTagInput",
	)
	.implement({
		description: "Input to unassign a tag from a user.",
		fields: (t) => ({
			assigneeId: t.id({
				description: "Global identifier of the user to unassign the tag to.",
				required: true,
			}),
			tagId: t.id({
				description: "Global identifier of the tag to be unassigned.",
				required: true,
			}),
		}),
	});
