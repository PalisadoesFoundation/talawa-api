import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItemCategory } from "../ActionItemCategory/actionItemCategory";
import { ActionItem } from "./actionItem";
// import { actionCategoriesTable } from "~/src/drizzle/schema";
export const resolveCategory = async (
	parent: { categoryId: string | null },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<ActionItemCategory | null> => {
	// If no categoryId is provided, return null.
	if (!parent.categoryId) {
		return null;
	}

	// Query the category by categoryId using the categoriesTable.
	const category =
		await ctx.drizzleClient.query.actionItemCategoriesTable.findFirst({
			where: (fields, operators) =>
				operators.eq(fields.id, parent.categoryId as string),
		});

	// If no category is found, log an error and throw an appropriate error.
	if (!category) {
		ctx.log.error(
			`Category with ID ${parent.categoryId} not found for ActionItem.`,
		);

		throw new TalawaGraphQLError({
			message: "Category not found",
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [
					{
						argumentPath: ["categoryId"],
					},
				],
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
