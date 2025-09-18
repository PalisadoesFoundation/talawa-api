import { z } from "zod";
import { eventVolunteersTableInsertSchema } from "~/src/drizzle/tables/EventVolunteer";
import { builder } from "~/src/graphql/builder";

/**
 * Zod schema for EventVolunteerInput validation.
 * Based on the old Talawa API EventVolunteerInput structure.
 */
export const eventVolunteerInputSchema = z.object({
	userId: eventVolunteersTableInsertSchema.shape.userId,
	eventId: eventVolunteersTableInsertSchema.shape.eventId,
	groupId: z.string().uuid().optional(), // For compatibility with old API
	// New fields for recurring events support
	isTemplate: z.boolean().optional(),
	recurringEventInstanceId: z.string().uuid().optional(),
});

/**
 * GraphQL input type for creating an EventVolunteer.
 * Matches the old Talawa API EventVolunteerInput structure.
 */
export const EventVolunteerInput = builder
	.inputRef<z.infer<typeof eventVolunteerInputSchema>>("EventVolunteerInput")
	.implement({
		description: "Input for creating an event volunteer.",
		fields: (t) => ({
			userId: t.id({
				description: "The ID of the user volunteering for the event.",
				required: true,
			}),
			eventId: t.id({
				description: "The ID of the event being volunteered for.",
				required: true,
			}),
			groupId: t.id({
				description: "Optional group ID for compatibility with old API.",
				required: false,
			}),
			isTemplate: t.boolean({
				description:
					"Whether this volunteer is a template for recurring events.",
				required: false,
			}),
			recurringEventInstanceId: t.id({
				description: "ID of specific recurring event instance (if applicable).",
				required: false,
			}),
		}),
	});
