import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Zod schema for UpdateEventVolunteerInput validation.
 * Based on the old Talawa API UpdateEventVolunteerInput structure.
 */
export const updateEventVolunteerInputSchema = z.object({
	assignments: z.array(z.string().uuid()).optional(),
	hasAccepted: z.boolean().optional(),
	isPublic: z.boolean().optional(),
});

/**
 * GraphQL input type for updating an EventVolunteer.
 * Matches the old Talawa API UpdateEventVolunteerInput structure.
 */
export const UpdateEventVolunteerInput = builder
	.inputRef<z.infer<typeof updateEventVolunteerInputSchema>>(
		"UpdateEventVolunteerInput",
	)
	.implement({
		description: "Input for updating an event volunteer.",
		fields: (t) => ({
			assignments: t.idList({
				description: "List of action item IDs assigned to the volunteer.",
				required: false,
			}),
			hasAccepted: t.boolean({
				description: "Whether the volunteer has accepted the invitation.",
				required: false,
			}),
			isPublic: t.boolean({
				description: "Whether the volunteer profile is public.",
				required: false,
			}),
		}),
	});
