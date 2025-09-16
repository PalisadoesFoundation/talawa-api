import { z } from "zod";
import { eventVolunteerGroupsTableInsertSchema } from "~/src/drizzle/tables/EventVolunteerGroup";
import { builder } from "~/src/graphql/builder";

/**
 * Zod schema for EventVolunteerGroupInput validation.
 * Based on the old Talawa API EventVolunteerGroupInput structure.
 */
export const eventVolunteerGroupInputSchema = z.object({
	name: eventVolunteerGroupsTableInsertSchema.shape.name,
	description:
		eventVolunteerGroupsTableInsertSchema.shape.description.optional(),
	eventId: eventVolunteerGroupsTableInsertSchema.shape.eventId,
	leaderId: eventVolunteerGroupsTableInsertSchema.shape.leaderId,
	volunteersRequired:
		eventVolunteerGroupsTableInsertSchema.shape.volunteersRequired.optional(),
	volunteerUserIds: z.array(z.string().uuid()).optional(), // For batch invitation in Chunk 5
});

/**
 * GraphQL input type for creating an EventVolunteerGroup.
 * Matches the old Talawa API EventVolunteerGroupInput structure.
 */
export const EventVolunteerGroupInput = builder
	.inputRef<z.infer<typeof eventVolunteerGroupInputSchema>>(
		"EventVolunteerGroupInput",
	)
	.implement({
		description: "Input for creating an event volunteer group.",
		fields: (t) => ({
			name: t.string({
				description: "The name of the volunteer group.",
				required: true,
			}),
			description: t.string({
				description: "The description of the volunteer group.",
				required: false,
			}),
			eventId: t.id({
				description: "The ID of the event this group is for.",
				required: true,
			}),
			leaderId: t.id({
				description: "The ID of the user who will lead this group.",
				required: true,
			}),
			volunteersRequired: t.int({
				description: "The number of volunteers required for this group.",
				required: false,
			}),
			volunteerUserIds: t.idList({
				description:
					"List of user IDs to invite to this group (for batch invitation).",
				required: false,
			}),
		}),
	});
