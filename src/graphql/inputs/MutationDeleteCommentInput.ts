import { z } from "zod";
import { commentsTableInsertSchema } from "~/src/drizzle/tables/comments";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteCommentInputSchema = z.object({
	id: commentsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteCommentInput = builder
	.inputRef<z.infer<typeof mutationDeleteCommentInputSchema>>(
		"MutationDeleteCommentInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the comment.",
				required: true,
			}),
		}),
	});
