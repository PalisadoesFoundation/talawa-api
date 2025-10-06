import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Zod schema for UpdateEventVolunteerGroupInput validation.
 * Based on the old Talawa API UpdateEventVolunteerGroupInput structure.
 */
export const updateEventVolunteerGroupInputSchema = z.object({
	eventId: z.string().uuid(),
	name: z.string().optional(),
	description: z.string().optional(),
	volunteersRequired: z.number().int().optional(),
});

/**
 * GraphQL input type for updating an EventVolunteerGroup.
 * Matches the old Talawa API UpdateEventVolunteerGroupInput structure.
 */
export const UpdateEventVolunteerGroupInput = builder
	.inputRef<z.infer<typeof updateEventVolunteerGroupInputSchema>>(
		"UpdateEventVolunteerGroupInput",
	)
	.implement({
		description: "Input for updating an event volunteer group.",
		fields: (t) => ({
			eventId: t.id({
				description: "The ID of the event (required for validation).",
				required: true,
			}),
			name: t.string({
				description: "The updated name of the volunteer group.",
				required: false,
			}),
			description: t.string({
				description: "The updated description of the volunteer group.",
				required: false,
			}),
			volunteersRequired: t.int({
				description:
					"The updated number of volunteers required for this group.",
				required: false,
			}),
		}),
	});
