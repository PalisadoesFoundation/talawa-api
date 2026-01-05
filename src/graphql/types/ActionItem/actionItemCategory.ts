import type { GraphQLContext } from "~/src/graphql/context";
import { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { ActionItem as ActionItemType } from "./ActionItem";
import { ActionItem } from "./ActionItem";

// Export the resolver function so it can be tested
export const resolveCategory = async (
	parent: ActionItemType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!parent.categoryId) {
		return null;
	}

	const existingCategory =
		await ctx.drizzleClient.query.actionItemCategoriesTable.findFirst({
			where: (fields, operators) =>
				operators.eq(fields.id, parent.categoryId as string),
		});

	if (existingCategory === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an action item's category id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingCategory;
};

ActionItem.implement({
	fields: (t) => ({
		category: t.field({
			description: "The category this action item belongs to.",
			type: ActionItemCategory,
			nullable: true,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveCategory, // Use the exported function
		}),
	}),
});
