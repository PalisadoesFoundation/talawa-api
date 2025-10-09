import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Zod schema for DeleteEventVolunteerForInstanceInput validation.
 */
export const deleteEventVolunteerForInstanceInputSchema = z.object({
	volunteerId: z.string().uuid(),
	recurringEventInstanceId: z.string().uuid(),
});

/**
 * GraphQL input type for deleting an EventVolunteer from a specific recurring event instance.
 */
export const DeleteEventVolunteerForInstanceInput = builder
	.inputRef<z.infer<typeof deleteEventVolunteerForInstanceInputSchema>>(
		"DeleteEventVolunteerForInstanceInput",
	)
	.implement({
		description:
			"Input for deleting a volunteer from a specific recurring event instance.",
		fields: (t) => ({
			volunteerId: t.id({
				description: "The ID of the volunteer to delete from the instance.",
				required: true,
			}),
			recurringEventInstanceId: t.id({
				description: "The ID of the specific recurring event instance.",
				required: true,
			}),
		}),
	});
