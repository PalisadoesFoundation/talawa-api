import { and, count, eq } from "drizzle-orm";
import { commentVotesTable } from "~/src/drizzle/tables/commentVotes";
import envConfig from "~/src/utilities/graphqLimits";
import { Comment } from "./Comment";

Comment.implement({
	fields: (t) => ({
		downVotesCount: t.field({
			description: "Total number of down votes on the comment.",
			resolve: async (parent, _args, ctx) => {
				const [commentVote] = await ctx.drizzleClient
					.select({
						count: count(),
					})
					.from(commentVotesTable)
					.where(
						and(
							eq(commentVotesTable.commentId, parent.id),
							eq(commentVotesTable.type, "down_vote"),
						),
					);

				if (commentVote === undefined) {
					return 0;
				}

				return commentVote.count;
			},
			type: "Int",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
		}),
	}),
});
