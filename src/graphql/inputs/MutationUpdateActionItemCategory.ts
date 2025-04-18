// src/graphql/inputs/MutationUpdateActionItemCategoryInput.ts

import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * 1️⃣ Zod schema for the mutation input payload
 */
export const mutationUpdateActionItemCategoryInputSchema = z.object({
	categoryId: z.string().uuid(), // ID of the category to update
	name: z.string().optional(),
	isDisabled: z.boolean().optional(),
});

/**
 * 2️⃣ Pothos GraphQL inputRef for schema
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
			categoryId: t.id({
				description: "The UUID of the category to update.",
				required: true,
			}),
			name: t.string({
				description: "Optional new name for the category.",
				required: false,
			}),
			isDisabled: t.boolean({
				description:
					"Optional flag to mark the category as disabled or enabled.",
				required: false,
			}),
		}),
	});

/**
 * 3️⃣ Top-level arguments schema: wraps the input under `{ input: … }`
 */
export const mutationUpdateActionItemCategoryArgumentsSchema = z.object({
	input: mutationUpdateActionItemCategoryInputSchema,
});
