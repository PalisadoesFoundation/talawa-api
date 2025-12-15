import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Zod schema for DeleteEventVolunteerGroupForInstanceInput validation.
 */
export const deleteEventVolunteerGroupForInstanceInputSchema = z.object({
	volunteerGroupId: z.string().uuid(),
	recurringEventInstanceId: z.string().uuid(),
});

/**
 * GraphQL input type for deleting an EventVolunteerGroup from a specific recurring event instance.
 */
export const DeleteEventVolunteerGroupForInstanceInput = builder
	.inputRef<z.infer<typeof deleteEventVolunteerGroupForInstanceInputSchema>>(
		"DeleteEventVolunteerGroupForInstanceInput",
	)
	.implement({
		description:
			"Input for deleting a volunteer group from a specific recurring event instance.",
		fields: (t) => ({
			volunteerGroupId: t.id({
				description:
					"The ID of the volunteer group to delete from the instance.",
				required: true,
			}),
			recurringEventInstanceId: t.id({
				description: "The ID of the specific recurring event instance.",
				required: true,
			}),
		}),
	});
