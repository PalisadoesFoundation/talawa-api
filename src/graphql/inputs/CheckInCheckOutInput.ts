import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { eventId, userId } from "~/src/graphql/validators/core";

/**
 * Zod schema for CheckInCheckOutInput validation.
 */
export const checkInCheckOutInputSchema = z
	.object({
		userId,
		eventId: eventId.optional(),
		recurringEventInstanceId: eventId.optional(),
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
 * GraphQL input type for check-in and check-out operations.
 */
export const CheckInCheckOutInput = builder
	.inputRef<z.infer<typeof checkInCheckOutInputSchema>>("CheckInCheckOutInput")
	.implement({
		description: "Input for check-in and check-out operations.",
		fields: (t) => ({
			userId: t.id({
				description: "The ID of the user to check in/out.",
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
