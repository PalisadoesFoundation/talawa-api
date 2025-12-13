import { z } from "zod";
import {
	COMMENT_BODY_MAX_LENGTH,
	commentsTableInsertSchema,
} from "~/src/drizzle/tables/comments";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateCommentInputSchema = z
	.object({
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
			.pipe(z.string().min(1).max(COMMENT_BODY_MAX_LENGTH))
			.optional(),
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
				required: false,
			}),
			id: t.id({
				description: "Global identifier of the comment.",
				required: true,
			}),
		}),
	});
