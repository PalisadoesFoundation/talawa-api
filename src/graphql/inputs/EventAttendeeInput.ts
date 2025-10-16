import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Zod schema for EventAttendeeInput validation.
 */
export const eventAttendeeInputSchema = z
	.object({
		userId: z.string().uuid(),
		eventId: z.string().uuid().optional(),
		recurringEventInstanceId: z.string().uuid().optional(),
	})
	.refine(
		(data) =>
			(data.eventId && !data.recurringEventInstanceId) ||
			(!data.eventId && data.recurringEventInstanceId),
		{
			message:
				"Either eventId or recurringEventInstanceId must be provided, but not both",
		},
	);

/**
 * GraphQL input type for event attendee operations.
 */
export const EventAttendeeInput = builder
	.inputRef<z.infer<typeof eventAttendeeInputSchema>>("EventAttendeeInput")
	.implement({
		description: "Input for event attendee operations.",
		fields: (t) => ({
			userId: t.id({
				description: "The ID of the user.",
				required: true,
			}),
			eventId: t.id({
				description: "The ID of the standalone event (for standalone events).",
				required: false,
			}),
			recurringEventInstanceId: t.id({
				description:
					"The ID of the recurring event instance (for recurring events).",
				required: false,
			}),
		}),
	});
