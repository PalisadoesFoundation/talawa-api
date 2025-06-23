import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { ActionItem } from "./ActionItem";

ActionItem.implement({
	fields: (t) => ({
		organization: t.field({
			description: "The organization the action item belongs to.",
			type: Organization,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: async (parent, _args, ctx) => {
				const existingOrganization =
					await ctx.drizzleClient.query.organizationsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parent.organizationId),
					});

				if (existingOrganization === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for an action item's organization id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingOrganization;
			},
		}),
	}),
});
