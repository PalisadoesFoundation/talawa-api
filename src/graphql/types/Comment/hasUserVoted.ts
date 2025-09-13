import type { z } from "zod";
import type { commentVoteTypeEnum } from "~/src/drizzle/enums/commentVoteType";
import { builder } from "~/src/graphql/builder";
import { CommentVoteType } from "../../enums/CommentVoteType";
import envConfig from "~/src/utilities/graphqLimits";
import { Comment } from "./Comment";

export const HasUserVotedComment = builder.objectRef<{
	hasVoted: boolean;
	voteType: z.infer<typeof commentVoteTypeEnum> | null;
}>("HasUserVotedComment");

HasUserVotedComment.implement({
	fields: (t) => ({
		hasVoted: t.field({
			type: "Boolean",
			nullable: false,
			description: "Indicates if the user has voted on this comment",
			resolve: (parent) => parent.hasVoted,
		}),
		voteType: t.expose("voteType", {
			type: CommentVoteType,
			nullable: true,
			description: "Type of the comment vote, null if no vote exists",
		}),
	}),
});

// Add the hasUserVoted field to the Comment type
Comment.implement({
	fields: (t) => ({
		hasUserVoted: t.field({
			args: {
				userId: t.arg.id({
					description: "The ID of the user to check if they have voted on this comment.",
					required: true,
				}),
			},
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			description: "Check if a specific user has voted on this comment and return vote details.",
			resolve: async (parent, args, ctx) => {
				const existingCommentVote = await ctx.drizzleClient.query.commentVotesTable.findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.commentId, parent.id),
							operators.eq(fields.creatorId, args.userId),
						),
				});

				if (existingCommentVote === undefined) {
					return {
						voteType: null,
						hasVoted: false,
					};
				}

				return {
					voteType: existingCommentVote.type,
					hasVoted: true,
				};
			},
			type: HasUserVotedComment,
		}),
	}),
});