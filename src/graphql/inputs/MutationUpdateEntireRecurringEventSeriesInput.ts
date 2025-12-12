import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateEntireRecurringEventSeriesInputSchema = z
	.object({
		id: z.string().uuid({
			message: "Must be a valid UUID for the recurring event instance ID.",
		}),
		// Only fields that make sense to update for all events (past, present, future)
		name: eventsTableInsertSchema.shape.name.optional(),
		description: eventsTableInsertSchema.shape.description.optional(),
	})
	.superRefine(({ id, ...remainingArgs }, ctx) => {
		// Ensure at least one field is being updated
		if (!Object.values(remainingArgs).some((value) => value !== undefined)) {
			ctx.addIssue({
				code: "custom",
				message: "At least one field must be provided for update.",
			});
		}

		// No timing validation needed since startAt/endAt are not included
	});

export const MutationUpdateEntireRecurringEventSeriesInput = builder
	.inputRef<
		z.infer<typeof mutationUpdateEntireRecurringEventSeriesInputSchema>
	>("MutationUpdateEntireRecurringEventSeriesInput")
	.implement({
		description: "Input for updating all events in a recurring event series.",
		fields: (t) => ({
			id: t.id({
				description:
					"Global identifier of any recurring event instance in the series to update.",
				required: true,
			}),
			name: t.string({
				description: "Updated name for all events in the series.",
			}),
			description: t.string({
				description: "Updated description for all events in the series.",
			}),
		}),
	});
