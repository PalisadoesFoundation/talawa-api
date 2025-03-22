import { z } from "zod";
import { actionsTableInsertSchema } from "~/src/drizzle/tables/actions";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteActionItemInputSchema = z.object({
	id: actionsTableInsertSchema.shape.id.unwrap(),
});

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
