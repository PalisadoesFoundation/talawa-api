import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteEventInputSchema = z.object({
	id: eventsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteEventInput = builder
	.inputRef<z.infer<typeof mutationDeleteEventInputSchema>>(
		"MutationDeleteEventInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the event.",
				required: true,
			}),
		}),
	});
