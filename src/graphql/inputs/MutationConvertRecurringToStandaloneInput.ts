import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";

export const mutationConvertRecurringToStandaloneInputSchema = z.object({
	eventId: eventsTableInsertSchema.shape.id.unwrap(),
});

export const MutationConvertRecurringToStandaloneInput = builder
	.inputRef<z.infer<typeof mutationConvertRecurringToStandaloneInputSchema>>(
		"MutationConvertRecurringToStandaloneInput",
	)
	.implement({
		description:
			"Input for converting a recurring event back to a standalone event.",
		fields: (t) => ({
			eventId: t.id({
				description:
					"ID of the recurring event template to convert to standalone.",
				required: true,
			}),
		}),
	});
