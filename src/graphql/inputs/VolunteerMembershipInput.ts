import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { VolunteerMembershipStatus } from "~/src/graphql/enums/VolunteerMembershipStatus";

/**
 * Zod schema for VolunteerMembershipInput validation.
 * Based on the old Talawa API VolunteerMembershipInput structure.
 */
export const volunteerMembershipInputSchema = z.object({
	event: z.string().uuid(),
	group: z.string().uuid().nullable().optional(),
	status: z.enum(["invited", "requested", "accepted", "rejected"]),
	userId: z.string().uuid(),
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
		}),
	});
