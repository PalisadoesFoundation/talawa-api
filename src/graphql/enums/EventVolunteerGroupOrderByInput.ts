import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Enum for EventVolunteerGroupOrderByInput options.
 * Based on the old Talawa API EventVolunteerGroupOrderByInput structure.
 */
export const eventVolunteerGroupOrderByInputEnum = z.enum([
	"volunteers_ASC",
	"volunteers_DESC",
	"assignments_ASC",
	"assignments_DESC",
]);

/**
 * GraphQL enum type for ordering EventVolunteerGroups.
 * Matches the old Talawa API EventVolunteerGroupOrderByInput structure.
 */
export const EventVolunteerGroupOrderByInput = builder.enumType(
	"EventVolunteerGroupOrderByInput",
	{
		description: "Enum for ordering event volunteer groups.",
		values: {
			volunteers_ASC: {
				description: "Order by number of volunteers in ascending order.",
				value: "volunteers_ASC",
			},
			volunteers_DESC: {
				description: "Order by number of volunteers in descending order.",
				value: "volunteers_DESC",
			},
			assignments_ASC: {
				description: "Order by number of assignments in ascending order.",
				value: "assignments_ASC",
			},
			assignments_DESC: {
				description: "Order by number of assignments in descending order.",
				value: "assignments_DESC",
			},
		},
	},
);
