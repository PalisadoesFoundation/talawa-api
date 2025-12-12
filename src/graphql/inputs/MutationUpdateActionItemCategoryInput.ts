import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { escapeHTML } from "~/src/utilities/sanitizer";

export const mutationUpdateActionItemCategoryInputSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).max(256).transform(escapeHTML).optional(),
	description: z.string().min(1).max(2048).transform(escapeHTML).optional(),
	isDisabled: z.boolean().optional(),
});

export const MutationUpdateActionItemCategoryInput = builder
	.inputRef<z.infer<typeof mutationUpdateActionItemCategoryInputSchema>>(
		"MutationUpdateActionItemCategoryInput",
	)
	.implement({
		description: "Input for updating an action item category.",
		fields: (t) => ({
			id: t.id({
				description: "ID of the action item category to update.",
				required: true,
			}),
			name: t.string({
				description: "New name of the action item category.",
			}),
			description: t.string({
				description: "New description of the action item category.",
			}),
			isDisabled: t.boolean({
				description: "Whether the category should be disabled.",
			}),
		}),
	});
