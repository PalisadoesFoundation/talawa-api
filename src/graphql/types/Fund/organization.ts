import { Organization } from "~/src/graphql/types/Organization/Organization";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import { Fund } from "./Fund";

/**
 * Resolves the organization that a fund belongs to.
 *
 * @param parent - The parent Fund object containing the organizationId.
 * @param _args - GraphQL arguments (unused).
 * @param ctx - The GraphQL context containing dataloaders and logging utilities.
 * @returns The organization the fund belongs to.
 * @throws TalawaGraphQLError with code "unexpected" if organization is not found (indicates data corruption).
 */
export const resolveOrganization = async (
	parent: Fund,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	const existingOrganization = await ctx.dataloaders.organization.load(
		parent.organizationId,
	);

	if (existingOrganization === null) {
		ctx.log.error(
			{
				fundId: parent.id,
				organizationId: parent.organizationId,
			},
			"DataLoader returned null for a fund's organization id that isn't null.",
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
