import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteEntireRecurringEventSeriesInputSchema = z.object({
	id: eventsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteEntireRecurringEventSeriesInput = builder
	.inputRef<
		z.infer<typeof mutationDeleteEntireRecurringEventSeriesInputSchema>
	>("MutationDeleteEntireRecurringEventSeriesInput")
	.implement({
		description:
			"Input for deleting an entire recurring event series (template + all instances).",
		fields: (t) => ({
			id: t.id({
				description:
					"Global identifier of the recurring event template to delete the entire series.",
				required: true,
			}),
		}),
	});
