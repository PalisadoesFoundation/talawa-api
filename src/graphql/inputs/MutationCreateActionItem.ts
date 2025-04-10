import { z } from "zod";
import { builder } from "~/src/graphql/builder";

// Zod schema for createActionItem input payload
export const mutationCreateActionItemInputSchema = z.object({
	categoryId: z.string().uuid(),
	assigneeId: z.string().uuid(),
	preCompletionNotes: z.string().optional(),
	eventId: z.string().uuid().optional(),
	organizationId: z.string().uuid(),
	assignedAt: z.string().optional(), // Optional ISO string. Defaults to current date-time if not provided.
});

export const MutationCreateActionItemInput = builder
	.inputRef<z.infer<typeof mutationCreateActionItemInputSchema>>(
		"MutationCreateActionItemInput",
	)
	.implement({
		description: "Input fields required for creating an action item.",
		fields: (t) => ({
			categoryId: t.id({
				description: "Global identifier of the action item's category.",
				required: true,
			}),
			assigneeId: t.id({
				description: "Global identifier of the action item assignee.",
				required: true,
			}),
			preCompletionNotes: t.string({
				description: "Optional notes that can be added before completion.",
				required: false,
			}),
			eventId: t.id({
				description: "Global identifier of the associated event, if any.",
				required: false,
			}),
			organizationId: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
			assignedAt: t.string({
				description:
					"Date-time string representing when the action item was assigned. Defaults to the current date-time if not provided.",
				required: false,
			}),
		}),
	});
