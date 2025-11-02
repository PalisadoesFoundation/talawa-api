import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteSingleEventInstanceInputSchema = z.object({
	id: eventsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteSingleEventInstanceInput = builder
	.inputRef<z.infer<typeof mutationDeleteSingleEventInstanceInputSchema>>(
		"MutationDeleteSingleEventInstanceInput",
	)
	.implement({
		description: "Input for deleting a single instance of a recurring event.",
		fields: (t) => ({
			id: t.id({
				description:
					"Global identifier of the recurring event instance to delete.",
				required: true,
			}),
		}),
	});
