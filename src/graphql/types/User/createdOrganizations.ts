import { Organization } from "~/src/graphql/types/Organization/Organization";
import { User } from "~/src/graphql/types/User/User";

User.implement({
	fields: (t) => ({
		createdOrganizations: t.field({
			type: [Organization],
			description: "Organizations created by the user",
			resolve: async (parent, _args, ctx) => {
				// Query the organizations table where the creator_id equals the user's id.
				return await ctx.drizzleClient.query.organizationsTable.findMany({
					where: (fields, operators) =>
						operators.eq(fields.creatorId, parent.id),
				});
			},
		}),
	}),
});
