// Import the GraphQL context type for request-scoped access (e.g. database, logger)
import type { GraphQLContext } from "~/src/graphql/context";

// Custom error utility for standardized error handling in the Talawa GraphQL layer
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Import the related GraphQL object type for category resolution
import { ActionItemCategory } from "../ActionItemCategory/actionItemCategory";

// Import the base ActionItem type to extend its fields
import { ActionItem } from "./actionItem";

/**
 * 🔹 Resolver: resolveCategory
 * - Resolves the `category` field for an `ActionItem`
 * - Looks up the associated ActionItemCategory by `actionItemCategoryId`
 */
export const resolveCategory = async (
	parent: { actionItemCategoryId: string | null },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<ActionItemCategory | null> => {
	const id = parent.actionItemCategoryId;

	// If no category ID is present, return null (nullable field)
	if (!id) return null;

	// Query the database to find the category by its ID
	const category =
		await ctx.drizzleClient.query.actionItemCategoriesTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, id),
		});

	// If the category isn't found, throw a structured GraphQL error
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

	// Return the matched category object
	return category;
};

/**
 * 🔹 Add `category` field to the `ActionItem` GraphQL type
 * - Resolves dynamically using the `resolveCategory` function
 * - Returns null if category not found or not set
 */
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
