import type { z } from "zod";
import type { postVoteTypeZodEnum } from "~/src/drizzle/enums/postVoteType";
import { builder } from "~/src/graphql/builder";
import envConfig from "~/src/utilities/graphqLimits";
import { PostVoteType } from "../../enums/PostVoteType";
import { Post } from "./Post";

export const HasUserVoted = builder.objectRef<{
	hasVoted: boolean;
	voteType: z.infer<typeof postVoteTypeZodEnum> | null;
}>("HasUserVoted");

HasUserVoted.implement({
	fields: (t) => ({
		hasVoted: t.field({
			type: "Boolean",
			nullable: false,
			description: "Indicates if the user has voted",
			resolve: (parent) => parent.hasVoted,
		}),
		voteType: t.expose("voteType", {
			type: PostVoteType,
			nullable: true,
			description: "Type of the post vote, null if no vote exists",
		}),
	}),
});

// Add the hasUserVoted field to the Post type
Post.implement({
	fields: (t) => ({
		hasUserVoted: t.field({
			args: {
				userId: t.arg.id({
					description:
						"The ID of the user to check if they have voted on this post.",
					required: true,
				}),
			},
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			description:
				"Check if a specific user has voted on this post and return vote details.",
			resolve: async (parent, args, ctx) => {
				const existingPostVote =
					await ctx.drizzleClient.query.postVotesTable.findFirst({
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.postId, parent.id),
								operators.eq(fields.creatorId, args.userId),
							),
					});

				if (existingPostVote === undefined) {
					return {
						voteType: null,
						hasVoted: false,
					};
				}
				return {
					voteType: existingPostVote.type as z.infer<
						typeof postVoteTypeZodEnum
					>,
					hasVoted: true,
				};
			},
			type: HasUserVoted,
		}),
	}),
});
