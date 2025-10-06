import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Enum for VolunteerMembershipOrderByInput options.
 * Based on the old Talawa API VolunteerMembershipOrderByInput structure.
 */
export const volunteerMembershipOrderByInputEnum = z.enum([
	"createdAt_ASC",
	"createdAt_DESC",
]);

/**
 * GraphQL enum type for ordering VolunteerMemberships.
 * Matches the old Talawa API VolunteerMembershipOrderByInput structure.
 */
export const VolunteerMembershipOrderByInput = builder.enumType(
	"VolunteerMembershipOrderByInput",
	{
		description: "Enum for ordering volunteer memberships.",
		values: {
			createdAt_ASC: {
				description: "Order by creation date in ascending order.",
				value: "createdAt_ASC",
			},
			createdAt_DESC: {
				description: "Order by creation date in descending order.",
				value: "createdAt_DESC",
			},
		},
	},
);
