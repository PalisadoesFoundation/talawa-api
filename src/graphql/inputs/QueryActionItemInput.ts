import { z } from "zod";
import { actionsTableInsertSchema } from "~/src/drizzle/tables/actions"; // ✅ Now imported successfully
import { builder } from "~/src/graphql/builder";

/**
 * Defines the Zod validation schema for querying an ActionItem.
 */
export const queryActionItemInputSchema = z.object({
	id: actionsTableInsertSchema.shape.id, // ✅ Extracts the ID schema correctly
});

/**
 * GraphQL Input Type for querying ActionItem by ID.
 */
export const QueryActionItemInput = builder
	.inputRef<z.infer<typeof queryActionItemInputSchema>>("QueryActionItemInput")
	.implement({
		description: "Input schema for querying an ActionItem by ID.",
		fields: (t) => ({
			id: t.string({
				description: "Global ID of the action item.",
				required: true,
			}),
		}),
	});
