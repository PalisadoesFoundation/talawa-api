import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteStandaloneEventInputSchema = z.object({
	id: eventsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteStandaloneEventInput = builder
	.inputRef<z.infer<typeof mutationDeleteStandaloneEventInputSchema>>(
		"MutationDeleteStandaloneEventInput",
	)
	.implement({
		description: "Input for deleting a standalone (non-recurring) event.",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the standalone event to delete.",
				required: true,
			}),
		}),
	});
