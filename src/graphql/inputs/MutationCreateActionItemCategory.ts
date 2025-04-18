// src/graphql/inputs/MutationCreateActionItemCategory.ts
import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * 1️⃣  Raw Zod schema for the mutation’s `input` payload
 */
export const mutationCreateActionItemCategoryInputSchema = z.object({
	name: z.string().min(1, { message: "Category name cannot be empty" }),
	organizationId: z.string().uuid(),
	isDisabled: z.boolean().optional(),
});

/**
 * 2️⃣  Pothos inputRef for GraphQL
 */
export const MutationCreateActionItemCategoryInput = builder
	.inputRef<z.infer<typeof mutationCreateActionItemCategoryInputSchema>>(
		"MutationCreateActionItemCategoryInput",
	)
	.implement({
		description:
			"Input fields required for creating a new Action Item Category. The category name is required, " +
			"the organization ID must be a valid UUID, and isDisabled is optional.",
		fields: (t) => ({
			name: t.string({
				description:
					"The name of the action item category. It cannot be empty.",
				required: true,
			}),
			organizationId: t.id({
				description:
					"Global identifier of the organization for which this category is being created.",
				required: true,
			}),
			isDisabled: t.boolean({
				description:
					"Optional flag indicating if the category should be disabled upon creation.",
				required: false,
			}),
		}),
	});

/**
 * 3️⃣  “Arguments” schema wrapping it under `{ input: … }`
 */
export const mutationCreateActionItemCategoryArgumentsSchema = z.object({
	input: mutationCreateActionItemCategoryInputSchema,
});
