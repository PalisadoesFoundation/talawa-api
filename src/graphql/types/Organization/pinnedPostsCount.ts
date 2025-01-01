import { and, count, eq, ne, sql } from "drizzle-orm";
import { postsTable } from "~/src/drizzle/tables/posts";
import { Organization } from "./Organization";

Organization.implement({
	fields: (t) => ({
		pinnedPostsCount: t.field({
			description:
				"Total number of pinned posts belonging to the organization.",
			resolve: async (parent, _args, ctx) => {
				const [postsCount] = await ctx.drizzleClient
					.select({
						count: count(),
					})
					.from(postsTable)
					.where(
						and(
							eq(postsTable.organizationId, parent.id),
							ne(postsTable.pinnedAt, sql`${null}`),
						),
					);

				if (postsCount === undefined) {
					return 0;
				}

				return postsCount.count;
			},
			type: "Int",
		}),
	}),
});
