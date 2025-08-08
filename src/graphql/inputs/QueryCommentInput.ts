import { z } from "zod";
import { commentsTableInsertSchema } from "~/src/drizzle/tables/comments";
import { builder } from "~/src/graphql/builder";

export const queryCommentInputSchema = z.object({
	id: commentsTableInsertSchema.shape.id.unwrap(),
});

export const QueryCommentInput = builder
	.inputRef<z.infer<typeof queryCommentInputSchema>>("QueryCommentInput")
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the comment.",
				required: true,
			}),
		}),
	});
