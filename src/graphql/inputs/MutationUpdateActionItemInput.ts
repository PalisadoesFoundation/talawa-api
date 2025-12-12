import type { z } from "zod";
import { actionItemsTableInsertSchema } from "~/src/drizzle/tables/actionItems";
import { builder } from "~/src/graphql/builder";
import { sanitizedStringSchema } from "~/src/utilities/sanitizer";

export const MutationUpdateActionItemInputSchema = actionItemsTableInsertSchema
	.pick({
		categoryId: true,
		volunteerId: true,
		volunteerGroupId: true,
		isCompleted: true,
	})
	.extend({
		postCompletionNotes: sanitizedStringSchema.optional(),
		preCompletionNotes: sanitizedStringSchema.optional(),
		id: actionItemsTableInsertSchema.shape.id.unwrap(), // require the id for update
	});

export const MutationUpdateActionItemInput = builder
	.inputRef<z.infer<typeof MutationUpdateActionItemInputSchema>>(
		"MutationUpdateActionItemInput",
	)
	.implement({
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the action item.",
				required: true,
			}),
			postCompletionNotes: t.string({
				description: "Post completion notes for the action item.",
			}),
			preCompletionNotes: t.string({
				description: "Pre completion notes for the action item.",
			}),
			categoryId: t.id({
				description: "Category identifier for the action item.",
			}),
			volunteerId: t.id({
				description:
					"Identifier for the volunteer assigned to the action item.",
			}),
			volunteerGroupId: t.id({
				description:
					"Identifier for the volunteer group assigned to the action item.",
			}),
			isCompleted: t.boolean({
				description: "Completion status of the action item.",
				required: true, // Ensures the type is a non-nullable boolean
			}),
		}),
	});
