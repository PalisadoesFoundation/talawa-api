import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import { RecurrenceInput, recurrenceInputSchema } from "./RecurrenceInput";

export const mutationConvertEventToRecurringInputSchema = z.object({
	eventId: eventsTableInsertSchema.shape.id.unwrap(),
	recurrence: recurrenceInputSchema,
});

export const MutationConvertEventToRecurringInput = builder
	.inputRef<z.infer<typeof mutationConvertEventToRecurringInputSchema>>(
		"MutationConvertEventToRecurringInput",
	)
	.implement({
		description:
			"Input for converting a standalone event to a recurring event.",
		fields: (t) => ({
			eventId: t.id({
				description: "ID of the standalone event to convert to recurring.",
				required: true,
			}),
			recurrence: t.field({
				description: "Recurrence pattern to apply to the event.",
				required: true,
				type: RecurrenceInput,
			}),
		}),
	});
