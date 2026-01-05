import { eq } from "drizzle-orm";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import type { GraphQLContext } from "~/src/graphql/context";
import { ActionItem } from "~/src/graphql/types/ActionItem/ActionItem";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { ActionItemCategory as ActionItemCategoryType } from "./ActionItemCategory";
import { ActionItemCategory } from "./ActionItemCategory";

// Export the resolver function so it can be tested
export const resolveActionItems = async (
	parent: ActionItemCategoryType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const actionItems = await ctx.drizzleClient.query.actionItemsTable.findMany({
		where: eq(actionItemsTable.categoryId, parent.id),
		orderBy: [actionItemsTable.assignedAt, actionItemsTable.id],
	});

	return actionItems;
};

ActionItemCategory.implement({
	fields: (t) => ({
		actionItems: t.field({
			description: "Action items that belong to this category.",
			resolve: resolveActionItems,
			type: [ActionItem],
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
