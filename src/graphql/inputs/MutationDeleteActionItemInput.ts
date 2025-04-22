// src/graphql/inputs/MutationDeleteActionItemInput.ts
import { z } from "zod";
import { actionsTableInsertSchema } from "~/src/drizzle/tables/actionItems";
import { builder } from "~/src/graphql/builder";

/**
 * 1️⃣ Schema for the `input` payload itself
 */
export const mutationDeleteActionItemInputSchema = z.object({
	id: actionsTableInsertSchema.shape.id.unwrap(),
});

/**
 * 2️⃣ Pothos inputRef for GraphQL
 */
export const MutationDeleteActionItemInput = builder
	.inputRef<z.infer<typeof mutationDeleteActionItemInputSchema>>(
		"MutationDeleteActionItemInput",
	)
	.implement({
		description: "Input for deleting an action item.",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the action item.",
				required: true,
			}),
		}),
	});

/**
 * 3️⃣ Top-level arguments schema (wraps it under `input`)
 */
export const mutationDeleteActionItemArgumentsSchema = z.object({
	input: mutationDeleteActionItemInputSchema,
});
