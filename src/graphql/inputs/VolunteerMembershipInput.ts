import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { VolunteerMembershipStatus } from "~/src/graphql/enums/VolunteerMembershipStatus";

/**
 * GraphQL enum for volunteer scope in recurring events.
 */
const VolunteerScopeEnum = builder.enumType("VolunteerMembershipScope", {
	values: {
		ENTIRE_SERIES: { value: "ENTIRE_SERIES" },
		THIS_INSTANCE_ONLY: { value: "THIS_INSTANCE_ONLY" },
	},
});

/**
 * Zod schema for VolunteerMembershipInput validation.
 * Based on the old Talawa API VolunteerMembershipInput structure.
 */
export const volunteerMembershipInputSchema = z.object({
	event: z.string().uuid(),
	group: z.string().uuid().nullable().optional(),
	status: z.enum(["invited", "requested", "accepted", "rejected"]),
	userId: z.string().uuid(),
	// Add scope fields for recurring event support
	scope: z.enum(["ENTIRE_SERIES", "THIS_INSTANCE_ONLY"]).optional(),
	recurringEventInstanceId: z.string().uuid().optional(),
});

/**
 * GraphQL input type for creating a VolunteerMembership.
 * Matches the old Talawa API VolunteerMembershipInput structure.
 */
export const VolunteerMembershipInput = builder
	.inputRef<z.infer<typeof volunteerMembershipInputSchema>>(
		"VolunteerMembershipInput",
	)
	.implement({
		description: "Input for creating a volunteer membership.",
		fields: (t) => ({
			event: t.id({
				description: "The ID of the event.",
				required: true,
			}),
			group: t.id({
				description:
					"The ID of the volunteer group (optional for individual volunteers, null for individual volunteering).",
				required: false,
			}),
			status: t.field({
				type: VolunteerMembershipStatus,
				description: "The status of the membership.",
				required: true,
			}),
			userId: t.id({
				description: "The ID of the user.",
				required: true,
			}),
			scope: t.field({
				type: VolunteerScopeEnum,
				description:
					"Whether this volunteer membership applies to 'ENTIRE_SERIES' (template) or 'THIS_INSTANCE_ONLY'",
				required: false,
			}),
			recurringEventInstanceId: t.id({
				description:
					"ID of specific recurring event instance (for 'THIS_INSTANCE_ONLY' scope).",
				required: false,
			}),
		}),
	});
