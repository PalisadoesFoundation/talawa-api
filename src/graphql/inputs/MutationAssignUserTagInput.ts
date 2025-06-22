import type { z } from "zod";
import { tagAssignmentsTableInsertSchema } from "~/src/drizzle/tables/tagAssignments";
import { builder } from "~/src/graphql/builder";

export const mutationAssignUserTagInputSchema = tagAssignmentsTableInsertSchema
	.pick({
		assigneeId: true,
		tagId: true,
	})
	.refine(
		({ assigneeId, tagId }) => assigneeId !== undefined && tagId !== undefined,
		{
			message: "Both assigneeId and tagId must be provided.",
		},
	);

export const MutationAssignUserTagInput = builder
	.inputRef<z.infer<typeof mutationAssignUserTagInputSchema>>(
		"MutationAssignUserTagInput",
	)
	.implement({
		description: "Input to assign a tag to a user",
		fields: (t) => ({
			assigneeId: t.id({
				description: "Global identifier of the user to assign the tag to.",
				required: true,
			}),
			tagId: t.id({
				description: "Global identifier of the tag to be assigned.",
				required: true,
			}),
		}),
	});
