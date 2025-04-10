import { z } from "zod";
import { builder } from "~/src/graphql/builder";

// Zod schema for createActionItemCategory input payload.
// Only the fields provided by the client (name, organizationId, and optional isDisabled)
// are defined here.
export const mutationCreateActionItemCategoryInputSchema = z.object({
	name: z.string().min(1, { message: "Category name cannot be empty" }),
	organizationId: z.string().uuid(),
	isDisabled: z.boolean().optional(),
});

// GraphQL input reference for the createActionItemCategory mutation.
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
