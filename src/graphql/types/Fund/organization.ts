import { Organization } from "~/src/graphql/types/Organization/Organization";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { Fund } from "./Fund";
export const resolveOrganization = async (
	parent: Fund,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	const existingOrganization =
		await ctx.drizzleClient.query.organizationsTable.findFirst({
			where: (fields, operators) =>
				operators.eq(fields.id, parent.organizationId),
		});

	if (existingOrganization === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for a fund's organization id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingOrganization;
};
Fund.implement({
	fields: (t) => ({
		organization: t.field({
			description: "Organization which the fund belongs to.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveOrganization,
			type: Organization,
		}),
	}),
});
