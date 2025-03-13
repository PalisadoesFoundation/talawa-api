import { and, ilike, sql } from "drizzle-orm";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { User } from "~/src/graphql/types/User/User";

User.implement({
	fields: (t) => ({
		createdOrganizations: t.field({
			type: [Organization],
			description: "Organizations created by the user",
			args: {
				filter: t.arg.string({ required: false }),
			},
			resolve: async (parent, { filter }, ctx) => {
				return await ctx.drizzleClient.query.organizationsTable.findMany({
					where: (fields, operators) =>
						and(
							operators.eq(fields.creatorId, parent.id),
							filter ? ilike(fields.name, `%${filter}%`) : sql`TRUE`,
						),
				});
			},
		}),
	}),
});
