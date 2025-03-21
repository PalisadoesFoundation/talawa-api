import type { z } from "zod";
import { actionsTableInsertSchema } from "~/src/drizzle/tables/actions";
import { builder } from "~/src/graphql/builder";

export const MutationUpdateActionItemInputSchema = actionsTableInsertSchema
	.pick({
		postCompletionNotes: true,
		preCompletionNotes: true,
		categoryId: true,
		assigneeId: true,
		isCompleted: true,
	})
	.extend({
		id: actionsTableInsertSchema.shape.id.unwrap(), // require the id for update
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
			assigneeId: t.id({
				description: "Identifier for the assignee of the action item.",
			}),
			isCompleted: t.boolean({
				description: "Completion status of the action item.",
				required: true, // Ensures the type is a non-nullable boolean
			}),
		}),
	});