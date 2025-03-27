import { and, count, eq } from "drizzle-orm";
import { postVotesTable } from "~/src/drizzle/tables/postVotes";
import envConfig from "~/src/utilities/graphqLimits";
import { Post } from "./Post";

Post.implement({
	fields: (t) => ({
		upVotesCount: t.field({
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			description: "Total number of up votes on the post.",
			resolve: async (parent, _args, ctx) => {
				const [postVote] = await ctx.drizzleClient
					.select({
						count: count(),
					})
					.from(postVotesTable)
					.where(
						and(
							eq(postVotesTable.postId, parent.id),
							eq(postVotesTable.type, "up_vote"),
						),
					);

				if (postVote === undefined) {
					return 0;
				}

				return postVote.count;
			},
			type: "Int",
		}),
	}),
});
