import type { z } from "zod";
import { commentsTableInsertSchema } from "~/src/drizzle/tables/comments";
import { builder } from "~/src/graphql/builder";
import { sanitizedStringSchema } from "~/src/utilities/sanitizer";

export const mutationCreateCommentInputSchema = commentsTableInsertSchema
	.pick({
		postId: true,
	})
	.extend({
		/**
		 * Body of the comment.
		 * We persist the raw (trimmed) text and perform HTML escaping at output time
		 * to avoid double-escaping and exceeding DB length limits with escaped entities.
		 */
		body: commentsTableInsertSchema.shape.body
			.transform((val) => sanitizedStringSchema.parse(val))
			.refine((val) => val.length <= 2000, {
				message: "Comment body must not exceed 2000 characters.",
			}),
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
