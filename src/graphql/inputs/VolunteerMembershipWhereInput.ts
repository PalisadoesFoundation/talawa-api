import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { VolunteerMembershipFilter } from "~/src/graphql/enums/VolunteerMembershipFilter";
import { VolunteerMembershipStatus } from "~/src/graphql/enums/VolunteerMembershipStatus";

/**
 * Zod schema for VolunteerMembershipWhereInput validation.
 * Based on the old Talawa API VolunteerMembershipWhereInput structure.
 */
export const volunteerMembershipWhereInputSchema = z.object({
	eventTitle: z.string().optional(),
	userName: z.string().optional(),
	status: z.enum(["invited", "requested", "accepted", "rejected"]).optional(),
	userId: z.string().uuid().optional(),
	eventId: z.string().uuid().optional(),
	groupId: z.string().uuid().optional(),
	filter: z.enum(["group", "individual"]).optional(),
});

/**
 * GraphQL input type for filtering VolunteerMemberships.
 * Matches the old Talawa API VolunteerMembershipWhereInput structure.
 */
export const VolunteerMembershipWhereInput = builder
	.inputRef<z.infer<typeof volunteerMembershipWhereInputSchema>>(
		"VolunteerMembershipWhereInput",
	)
	.implement({
		description: "Input for filtering volunteer memberships.",
		fields: (t) => ({
			eventTitle: t.string({
				description: "Filter by event title containing this string.",
				required: false,
			}),
			userName: t.string({
				description: "Filter by user name containing this string.",
				required: false,
			}),
			status: t.field({
				type: VolunteerMembershipStatus,
				description: "Filter by membership status.",
				required: false,
			}),
			userId: t.id({
				description: "Filter by user ID.",
				required: false,
			}),
			eventId: t.id({
				description: "Filter by event ID.",
				required: false,
			}),
			groupId: t.id({
				description: "Filter by group ID.",
				required: false,
			}),
			filter: t.field({
				type: VolunteerMembershipFilter,
				description: "Filter by membership type (group or individual).",
				required: false,
			}),
		}),
	});
