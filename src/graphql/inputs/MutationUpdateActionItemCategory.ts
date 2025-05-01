// src/graphql/inputs/MutationUpdateActionItemCategoryInput.ts

// Import Zod for runtime validation
import { z } from "zod";

// Import GraphQL schema builder (Pothos)
import { builder } from "~/src/graphql/builder";

/**
 * 🔹 1️⃣ Zod schema for the update mutation input
 * - `categoryId`: Required UUID to identify the category
 * - `name`: Optional updated name for the category
 * - `isDisabled`: Optional flag to disable/enable the category
 */
export const mutationUpdateActionItemCategoryInputSchema = z.object({
	categoryId: z.string().uuid(), // Required: the category to update
	name: z.string().optional(), // Optional: new name for the category
	isDisabled: z.boolean().optional(), // Optional: updated disabled state
});

/**
 * 🔹 2️⃣ GraphQL input type definition using builder.inputRef
 * Creates a reusable named input type in the GraphQL schema.
 */
export const MutationUpdateActionItemCategoryInput = builder
	.inputRef<z.infer<typeof mutationUpdateActionItemCategoryInputSchema>>(
		"MutationUpdateActionItemCategoryInput",
	)
	.implement({
		description:
			"Input fields required for updating an Action Item Category. " +
			"You can update the category name and/or the disabled state.",
		fields: (t) => ({
			// Required category ID to identify which record to update
			categoryId: t.id({
				description: "The UUID of the category to update.",
				required: true,
			}),

			// Optional new name for the category
			name: t.string({
				description: "Optional new name for the category.",
				required: false,
			}),

			// Optional boolean to enable or disable the category
			isDisabled: t.boolean({
				description:
					"Optional flag to mark the category as disabled or enabled.",
				required: false,
			}),
		}),
	});

/**
 * 🔹 3️⃣ Zod schema for GraphQL mutation arguments
 * Wraps the input schema inside a top-level `input` key
 * to match GraphQL mutation argument format: `{ input: { ... } }`
 */
export const mutationUpdateActionItemCategoryArgumentsSchema = z.object({
	input: mutationUpdateActionItemCategoryInputSchema,
});
