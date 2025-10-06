import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Zod schema for EventVolunteerGroupWhereInput validation.
 * Based on the old Talawa API EventVolunteerGroupWhereInput structure.
 */
export const eventVolunteerGroupWhereInputSchema = z.object({
	eventId: z.string().uuid().optional(),
	userId: z.string().uuid().optional(),
	orgId: z.string().uuid().optional(),
	leaderName: z.string().optional(),
	name_contains: z.string().optional(),
});

/**
 * GraphQL input type for filtering EventVolunteerGroups.
 * Matches the old Talawa API EventVolunteerGroupWhereInput structure.
 */
export const EventVolunteerGroupWhereInput = builder
	.inputRef<z.infer<typeof eventVolunteerGroupWhereInputSchema>>(
		"EventVolunteerGroupWhereInput",
	)
	.implement({
		description: "Input for filtering event volunteer groups.",
		fields: (t) => ({
			eventId: t.id({
				description: "Filter by event ID.",
				required: false,
			}),
			userId: t.id({
				description: "Filter by user ID (for user's groups).",
				required: false,
			}),
			orgId: t.id({
				description: "Filter by organization ID.",
				required: false,
			}),
			leaderName: t.string({
				description: "Filter by leader name containing this string.",
				required: false,
			}),
			name_contains: t.string({
				description: "Filter by group name containing this string.",
				required: false,
			}),
		}),
	});
