import { and, count, eq } from "drizzle-orm";
import { commentsTable } from "~/src/drizzle/tables/comments";
import { Post } from "./Post";

Post.implement({
	fields: (t) => ({
		commentsCount: t.field({
			description: "Total number of comments created under the post.",
			resolve: async (parent, _args, ctx) => {
				const [commentsCount] = await ctx.drizzleClient
					.select({
						count: count(),
					})
					.from(commentsTable)
					.where(and(eq(commentsTable.postId, parent.id)));

				if (commentsCount === undefined) {
					return 0;
				}

				return commentsCount.count;
			},
			type: "Int",
		}),
	}),
});
