import { z } from "zod";
import { eventVolunteerGroupsTableInsertSchema } from "~/src/drizzle/tables/EventVolunteerGroup";
import { builder } from "~/src/graphql/builder";

/**
 * GraphQL enum for volunteer group scope in recurring events.
 */
const VolunteerGroupScopeEnum = builder.enumType("VolunteerGroupScope", {
	values: {
		ENTIRE_SERIES: { value: "ENTIRE_SERIES" },
		THIS_INSTANCE_ONLY: { value: "THIS_INSTANCE_ONLY" },
	},
});

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
	// Template-First Hierarchy: scope defines whether this is for "entire series" or "this instance only"
	scope: z.enum(["ENTIRE_SERIES", "THIS_INSTANCE_ONLY"]).optional(),
	recurringEventInstanceId: z.string().uuid().optional(), // For "THIS_INSTANCE_ONLY" scope
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
			scope: t.field({
				type: VolunteerGroupScopeEnum,
				description:
					"Whether this volunteer group applies to 'ENTIRE_SERIES' (template) or 'THIS_INSTANCE_ONLY'",
				required: false,
			}),
			recurringEventInstanceId: t.id({
				description:
					"ID of specific recurring event instance (for 'THIS_INSTANCE_ONLY' scope).",
				required: false,
			}),
		}),
	});
