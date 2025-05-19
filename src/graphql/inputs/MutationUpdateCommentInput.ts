import { z } from "zod";
import { commentsTableInsertSchema } from "~/src/drizzle/tables/comments";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateCommentInputSchema = z
	.object({
		body: commentsTableInsertSchema.shape.body.optional(),
		id: commentsTableInsertSchema.shape.id.unwrap(),
	})
	.refine(
		({ id, ...remainingArg }) =>
			Object.values(remainingArg).some((value) => value !== undefined),
		{
			message: "At least one optional argument must be provided.",
		},
	);

export const MutationUpdateCommentInput = builder
	.inputRef<z.infer<typeof mutationUpdateCommentInputSchema>>(
		"MutationUpdateCommentInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			body: t.string({
				description: "Body of the comment.",
			}),
			id: t.id({
				description: "Global identifier of the comment.",
				required: true,
			}),
		}),
	});
