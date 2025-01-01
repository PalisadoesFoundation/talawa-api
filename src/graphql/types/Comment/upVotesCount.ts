import { and, count, eq } from "drizzle-orm";
import { commentVotesTable } from "~/src/drizzle/tables/commentVotes";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Comment } from "./Comment";

Comment.implement({
	fields: (t) => ({
		upVotesCount: t.field({
			description: "Total number of up votes on the comment.",
			resolve: async (parent, _args, ctx) => {
				const [commentVotesCount] = await ctx.drizzleClient
					.select({
						count: count(),
					})
					.from(commentVotesTable)
					.where(
						and(
							eq(commentVotesTable.commentId, parent.id),
							eq(commentVotesTable.type, "up_vote"),
						),
					);

				// Selected postgres aggregate  not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
				if (commentVotesCount === undefined) {
					ctx.log.error(
						"Postgres aggregate select operation unexpectedly returned an empty array instead of throwing an error.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return commentVotesCount.count;
			},
			type: "Int",
		}),
	}),
});
