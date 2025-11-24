import { builder } from "~/src/graphql/builder";

/**
 * GraphQL enum type for volunteer membership filter.
 * Used to filter memberships by type (group or individual).
 */
export const VolunteerMembershipFilter = builder.enumType(
	"VolunteerMembershipFilter",
	{
		description: "Filter for volunteer membership type.",
		values: {
			group: {
				description: "Filter for group memberships.",
				value: "group",
			},
			individual: {
				description: "Filter for individual volunteer memberships.",
				value: "individual",
			},
		},
	},
);
