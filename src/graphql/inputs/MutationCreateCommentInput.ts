import { z } from "zod";
import {
	COMMENT_BODY_MAX_LENGTH,
	commentsTableInsertSchema,
} from "~/src/drizzle/tables/comments";
import { builder } from "~/src/graphql/builder";

export const mutationCreateCommentInputSchema = commentsTableInsertSchema
	.pick({
		postId: true,
	})
	.extend({
		/**
		 * Body of the comment.
		 * We persist the raw (trimmed) text and perform HTML escaping at output time
		 * to avoid double-escaping and exceeding DB length limits with escaped entities.
		 *
		 * Transform is applied BEFORE length checks to ensure whitespace-only
		 * inputs are rejected (they become empty string after trim, failing min(1)).
		 */
		body: z
			.string()
			.transform((val) => val.trim())
			.pipe(
				z
					.string()
					.min(1)
					.max(COMMENT_BODY_MAX_LENGTH, {
						message: `Comment body must not exceed ${COMMENT_BODY_MAX_LENGTH} characters.`,
					}),
			),
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
