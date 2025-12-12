import type { z } from "zod";
import { commentsTableInsertSchema } from "~/src/drizzle/tables/comments";
import { builder } from "~/src/graphql/builder";
import { sanitizedStringSchema } from "~/src/utilities/sanitizer";

export const mutationCreateCommentInputSchema = commentsTableInsertSchema
	.pick({
		postId: true,
	})
	.extend({
		body: sanitizedStringSchema,
	});

export const MutationCreateCommentInput = builder
	.inputRef<z.infer<typeof mutationCreateCommentInputSchema>>(
		"MutationCreateCommentInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			body: t.string({
				description: "Body of the comment.",
				required: true,
			}),
			postId: t.id({
				description:
					"Global identifier of the post on which the comment is made.",
				required: true,
			}),
		}),
	});
