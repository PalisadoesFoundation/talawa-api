import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { nonEmptyString, orgId } from "~/src/graphql/validators/core";

export const mutationCreateActionItemCategoryInputSchema = z.object({
	name: nonEmptyString.max(256),
	description: nonEmptyString.max(2048).optional(),
	organizationId: orgId,
	isDisabled: z.boolean().optional().default(false),
});

export const MutationCreateActionItemCategoryInput = builder
	.inputRef<z.infer<typeof mutationCreateActionItemCategoryInputSchema>>(
		"MutationCreateActionItemCategoryInput",
	)
	.implement({
		description: "Input for creating a new action item category.",
		fields: (t) => ({
			name: t.string({
				description: "Name of the action item category.",
				required: true,
			}),
			description: t.string({
				description: "Description of the action item category.",
			}),
			organizationId: t.id({
				description: "ID of the organization this category belongs to.",
				required: true,
			}),
			isDisabled: t.boolean({
				description: "Whether the category is disabled.",
				required: true,
			}),
		}),
	});
