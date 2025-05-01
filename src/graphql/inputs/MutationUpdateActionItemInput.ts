// src/graphql/inputs/MutationUpdateActionItemInput.ts

// Import Zod types and schema utilities
import type { z } from "zod";
import { z as zod } from "zod";

// Import the base insert schema from the Drizzle table definition
import { actionsTableInsertSchema } from "~/src/drizzle/tables/actionItems";

// Import GraphQL schema builder (Pothos)
import { builder } from "~/src/graphql/builder";

/**
 * 🔹 1️⃣ Base Zod input schema for updating an action item
 * - Picks a subset of fields from the insert schema
 * - Adds the `id` field for identifying the record to update
 * - Makes `allottedHours` optional and nullable
 */
export const MutationUpdateActionItemInputSchema = actionsTableInsertSchema
	.pick({
		postCompletionNotes: true,
		preCompletionNotes: true,
		actionItemCategoryId: true,
		assigneeId: true,
		isCompleted: true,
	})
	.extend({
		// Required field for identifying which item to update
		id: actionsTableInsertSchema.shape.id.unwrap(),

		// Optional field: estimated hours; can be null
		allottedHours: zod.number().nullable().optional(),
	});

/**
 * 🔹 2️⃣ GraphQL input type definition using builder.inputRef
 * Defines the named input object in the GraphQL schema.
 */
export const MutationUpdateActionItemInput = builder
	.inputRef<z.infer<typeof MutationUpdateActionItemInputSchema>>(
		"MutationUpdateActionItemInput",
	)
	.implement({
		fields: (t) => ({
			// ID of the action item to update (required)
			id: t.id({
				description: "Global identifier of the action item.",
				required: true,
			}),

			// Optional post-completion notes
			postCompletionNotes: t.string({
				description: "Post completion notes for the action item.",
			}),

			// Optional pre-completion notes
			preCompletionNotes: t.string({
				description: "Pre completion notes for the action item.",
			}),

			// Category the action item belongs to
			actionItemCategoryId: t.id({
				description: "Category identifier for the action item.",
			}),

			// ID of the user assigned to the item
			assigneeId: t.id({
				description: "Identifier for the assignee of the action item.",
			}),

			// Required boolean indicating if the item is completed
			isCompleted: t.boolean({
				description: "Completion status of the action item.",
				required: true,
			}),

			// Optional number of hours allotted
			allottedHours: t.int({
				description: "Number of hours allotted for completion.",
				required: false,
			}),
		}),
	});

/**
 * 🔹 3️⃣ Top-level Zod schema for GraphQL mutation arguments
 * Wraps the mutation input inside an `input` field.
 */
export const mutationUpdateActionItemArgumentsSchema = zod.object({
	input: MutationUpdateActionItemInputSchema,
});
