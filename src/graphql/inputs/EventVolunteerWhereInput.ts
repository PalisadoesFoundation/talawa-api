import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Zod schema for EventVolunteerWhereInput validation.
 * Based on the old Talawa API EventVolunteerWhereInput structure.
 */
export const eventVolunteerWhereInputSchema = z.object({
	id: z.string().uuid().optional(),
	eventId: z.string().uuid().optional(),
	groupId: z.string().uuid().optional(),
	hasAccepted: z.boolean().optional(),
	name_contains: z.string().optional(),
});

/**
 * GraphQL input type for filtering EventVolunteers.
 * Matches the old Talawa API EventVolunteerWhereInput structure.
 */
export const EventVolunteerWhereInput = builder
	.inputRef<z.infer<typeof eventVolunteerWhereInputSchema>>(
		"EventVolunteerWhereInput",
	)
	.implement({
		description: "Input for filtering event volunteers.",
		fields: (t) => ({
			id: t.id({
				description: "Filter by volunteer ID.",
				required: false,
			}),
			eventId: t.id({
				description: "Filter by event ID.",
				required: false,
			}),
			groupId: t.id({
				description: "Filter by group ID (for compatibility).",
				required: false,
			}),
			hasAccepted: t.boolean({
				description: "Filter by acceptance status.",
				required: false,
			}),
			name_contains: t.string({
				description: "Filter by volunteer name containing this string.",
				required: false,
			}),
		}),
	});
