import type { InferSelectModel } from "drizzle-orm";
import type { actionItemCategoriesTable } from "~/src/drizzle/tables/actionItemCategories";
import { builder } from "~/src/graphql/builder";

// Define the TypeScript type for ActionItemCategory using the Drizzle table schema
export type ActionItemCategory = InferSelectModel<
	typeof actionItemCategoriesTable
>;

// Create a GraphQL object reference for ActionItemCategory
export const ActionItemCategory =
	builder.objectRef<ActionItemCategory>("ActionItemCategory");

// Implement the fields and description for the ActionItemCategory GraphQL object
ActionItemCategory.implement({
	description:
		"Represents a category for action items, including metadata such as creation and update timestamps.",
	fields: (t) => ({
		// Expose the unique identifier field for the category
		id: t.exposeID("id", {
			description: "Unique identifier for the action item category.",
		}),

		// Expose the name of the category
		name: t.exposeString("name", {
			description: "The name of the action item category.",
		}),

		// Expose whether the category is currently disabled
		isDisabled: t.exposeBoolean("isDisabled", {
			description: "Indicates whether the action item category is disabled.",
		}),
	}),
});
