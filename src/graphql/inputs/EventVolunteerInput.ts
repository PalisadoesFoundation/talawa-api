import { z } from "zod";
import { eventVolunteersTableInsertSchema } from "~/src/drizzle/tables/eventVolunteers";
import { builder } from "~/src/graphql/builder";

/**
 * GraphQL enum for volunteer scope in recurring events.
 */
const VolunteerScopeEnum = builder.enumType("VolunteerScope", {
	values: {
		ENTIRE_SERIES: { value: "ENTIRE_SERIES" },
		THIS_INSTANCE_ONLY: { value: "THIS_INSTANCE_ONLY" },
	},
});

/**
 * Zod schema for EventVolunteerInput validation.
 * Based on the old Talawa API EventVolunteerInput structure.
 */
export const eventVolunteerInputSchema = z.object({
	userId: eventVolunteersTableInsertSchema.shape.userId,
	eventId: eventVolunteersTableInsertSchema.shape.eventId,
	groupId: z.string().uuid().optional(), // For compatibility with old API
	// Template-First Hierarchy: scope defines whether this is for "entire series" or "this instance only"
	scope: z.enum(["ENTIRE_SERIES", "THIS_INSTANCE_ONLY"]).optional(),
	recurringEventInstanceId: z.string().uuid().optional(), // For "THIS_INSTANCE_ONLY" scope
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
			scope: t.field({
				type: VolunteerScopeEnum,
				description:
					"Whether this volunteer applies to 'ENTIRE_SERIES' (template) or 'THIS_INSTANCE_ONLY'",
				required: false,
			}),
			recurringEventInstanceId: t.id({
				description:
					"ID of specific recurring event instance (for 'THIS_INSTANCE_ONLY' scope).",
				required: false,
			}),
		}),
	});
