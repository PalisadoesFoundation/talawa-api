import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItemCategory } from "../ActionItemCategory/actionItemCategory";
import { ActionItem } from "./actionItem";
export const resolveCategory = async (
	parent: { actionItemCategoryId: string | null },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<ActionItemCategory | null> => {
	const id = parent.actionItemCategoryId;
	if (!id) return null;

	const category =
		await ctx.drizzleClient.query.actionItemCategoriesTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, id),
		});

	if (!category) {
		ctx.log.error(`Category with ID ${id} not found for ActionItem.`);
		throw new TalawaGraphQLError({
			message: "Category not found",
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [{ argumentPath: ["actionItemCategoryId"] }],
			},
		});
	}
	return category;
};

ActionItem.implement({
	fields: (t) => ({
		category: t.field({
			type: ActionItemCategory,
			nullable: true,
			description: "The category associated with this action item.",
			resolve: resolveCategory,
		}),
	}),
});
