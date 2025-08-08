import type { z } from "zod";
import { commentVotesTableInsertSchema } from "~/src/drizzle/tables/commentVotes";
import { builder } from "~/src/graphql/builder";
import { CommentVoteType } from "~/src/graphql/enums/CommentVoteType";

export const mutationUpdateCommentVoteInputSchema =
	commentVotesTableInsertSchema.pick({
		commentId: true,
		type: true,
	});

export const MutationUpdateCommentVoteInput = builder
	.inputRef<z.infer<typeof mutationUpdateCommentVoteInputSchema>>(
		"MutationUpdateCommentVoteInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			commentId: t.id({
				description: "Global identifier of the comment that is voted.",
				required: true,
			}),
			type: t.field({
				description: "Type of the vote.",
				required: true,
				type: CommentVoteType,
			}),
		}),
	});
