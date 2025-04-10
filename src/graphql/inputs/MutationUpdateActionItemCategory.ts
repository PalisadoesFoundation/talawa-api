import { z } from "zod";
import { builder } from "~/src/graphql/builder";

// Zod schema for the update ActionItemCategory input payload.
// Only the fields provided by the client are included here.
export const mutationUpdateActionItemCategoryInputSchema = z.object({
	categoryId: z.string().uuid(), // The ID of the category to update.
	name: z.string().optional(),
	isDisabled: z.boolean().optional(),
});

// GraphQL input reference for updating an Action Item Category.
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
