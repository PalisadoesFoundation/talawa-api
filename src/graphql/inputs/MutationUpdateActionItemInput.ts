// src/graphql/inputs/MutationUpdateActionItemInput.ts

import type { z } from "zod";
import { z as zod } from "zod";
import { actionsTableInsertSchema } from "~/src/drizzle/tables/actionItems";
import { builder } from "~/src/graphql/builder";

/**
 * 1️⃣ Base input schema (used for validation)
 */
export const MutationUpdateActionItemInputSchema = actionsTableInsertSchema
	.pick({
		postCompletionNotes: true,
		preCompletionNotes: true,
		categoryId: true,
		assigneeId: true,
		isCompleted: true,
	})
	.extend({
		id: actionsTableInsertSchema.shape.id.unwrap(), // required for update
		allottedHours: zod.number().nullable().optional(), // ✅ added
	});

/**
 * 2️⃣ Pothos inputRef (used for GraphQL input type)
 */
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
				required: true,
			}),
			allottedHours: t.int({
				description: "Number of hours allotted for completion.",
				required: false,
			}),
		}),
	});

/**
 * 3️⃣ Mutation arguments schema (Zod wrapped in `{ input: … }`)
 */
export const mutationUpdateActionItemArgumentsSchema = zod.object({
	input: MutationUpdateActionItemInputSchema,
});
