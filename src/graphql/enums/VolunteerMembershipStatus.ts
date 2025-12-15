import { builder } from "~/src/graphql/builder";

/**
 * GraphQL enum type for volunteer membership status.
 * Based on the old Talawa API volunteer membership status values.
 */
export const VolunteerMembershipStatus = builder.enumType(
	"VolunteerMembershipStatus",
	{
		description: "Possible statuses for volunteer membership.",
		values: {
			invited: {
				description: "Admin invited the volunteer to join a group.",
				value: "invited",
			},
			requested: {
				description: "Volunteer requested to join a group.",
				value: "requested",
			},
			accepted: {
				description: "Membership has been accepted.",
				value: "accepted",
			},
			rejected: {
				description: "Membership has been rejected.",
				value: "rejected",
			},
		},
	},
);
