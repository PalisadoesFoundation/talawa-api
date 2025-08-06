import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteThisAndFollowingEventsInputSchema = z.object({
	id: eventsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteThisAndFollowingEventsInput = builder
	.inputRef<z.infer<typeof mutationDeleteThisAndFollowingEventsInputSchema>>(
		"MutationDeleteThisAndFollowingEventsInput",
	)
	.implement({
		description:
			"Input for deleting the current instance and all following instances of a recurring event.",
		fields: (t) => ({
			id: t.id({
				description:
					"Global identifier of the recurring event instance from which to delete this and following instances.",
				required: true,
			}),
		}),
	});
