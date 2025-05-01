// src/graphql/inputs/MutationCreateActionItemCategory.ts

// Zod is used for runtime validation
import { z } from "zod";

// Builder from Pothos for defining GraphQL input types
import { builder } from "~/src/graphql/builder";

/**
 * 🔹 1️⃣ Raw Zod schema for validating the input payload of the mutation
 * - `name`: Required, non-empty string
 * - `organizationId`: Required UUID string
 * - `isDisabled`: Optional boolean
 */
export const mutationCreateActionItemCategoryInputSchema = z.object({
	name: z.string().min(1, { message: "Category name cannot be empty" }),
	organizationId: z.string().uuid(),
	isDisabled: z.boolean().optional(),
});

/**
 * 🔹 2️⃣ GraphQL input type definition using Pothos inputRef
 * This creates a named input type in the GraphQL schema with field descriptions.
 */
export const MutationCreateActionItemCategoryInput = builder
	.inputRef<z.infer<typeof mutationCreateActionItemCategoryInputSchema>>(
		"MutationCreateActionItemCategoryInput",
	)
	.implement({
		description:
			"Input fields required for creating a new Action Item Category. " +
			"The category name is required, the organization ID must be a valid UUID, and isDisabled is optional.",
		fields: (t) => ({
			// Name of the category (cannot be empty)
			name: t.string({
				description:
					"The name of the action item category. It cannot be empty.",
				required: true,
			}),

			// Organization under which the category is being created
			organizationId: t.id({
				description:
					"Global identifier of the organization for which this category is being created.",
				required: true,
			}),

			// Whether this category should be disabled initially
			isDisabled: t.boolean({
				description:
					"Optional flag indicating if the category should be disabled upon creation.",
				required: false,
			}),
		}),
	});

/**
 * 🔹 3️⃣ GraphQL argument schema wrapping the input inside an `input` object
 * This matches GraphQL mutation signatures that accept `input: {...}`.
 */
export const mutationCreateActionItemCategoryArgumentsSchema = z.object({
	input: mutationCreateActionItemCategoryInputSchema,
});
