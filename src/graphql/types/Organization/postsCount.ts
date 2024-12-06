import { count, eq } from "drizzle-orm";
import { postsTable } from "~/src/drizzle/tables/posts";
import { Organization } from "./Organization";

Organization.implement({
	fields: (t) => ({
		postsCount: t.field({
			description: "Total number of posts in the organization.",
			resolve: async (parent, _args, ctx) => {
				const [postsCount] = await ctx.drizzleClient
					.select({
						count: count(),
					})
					.from(postsTable)
					.where(eq(postsTable.organizationId, parent.id));

				if (postsCount === undefined) {
					return 0;
				}

				return postsCount.count;
			},
			type: "Int",
		}),
	}),
});
