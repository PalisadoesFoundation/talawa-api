import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Enum for EventVolunteersOrderByInput options.
 * Based on the old Talawa API EventVolunteersOrderByInput structure.
 */
export const eventVolunteersOrderByInputEnum = z.enum([
	"hoursVolunteered_ASC",
	"hoursVolunteered_DESC",
]);

/**
 * GraphQL enum type for ordering EventVolunteers.
 * Matches the old Talawa API EventVolunteersOrderByInput structure.
 */
export const EventVolunteersOrderByInput = builder.enumType(
	"EventVolunteersOrderByInput",
	{
		description: "Enum for ordering event volunteers.",
		values: {
			hoursVolunteered_ASC: {
				description: "Order by hours volunteered in ascending order.",
				value: "hoursVolunteered_ASC",
			},
			hoursVolunteered_DESC: {
				description: "Order by hours volunteered in descending order.",
				value: "hoursVolunteered_DESC",
			},
		},
	},
);
