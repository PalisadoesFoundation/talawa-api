import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { ActionItem as ActionItemType } from "./ActionItem";
import { ActionItem } from "./ActionItem";

// Export the resolver function so it can be tested
export const resolveOrganization = async (
	parent: ActionItemType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	const existingOrganization = await ctx.dataloaders.organization.load(
		parent.organizationId,
	);

	if (existingOrganization === null) {
		ctx.log.error(
			{
				actionItemId: parent.id,
				organizationId: parent.organizationId,
			},
			"DataLoader returned null for an action item's organization id that isn't null",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingOrganization;
};

ActionItem.implement({
	fields: (t) => ({
		organization: t.field({
			description: "The organization the action item belongs to.",
			type: Organization,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveOrganization, // Use the exported function
		}),
	}),
});
