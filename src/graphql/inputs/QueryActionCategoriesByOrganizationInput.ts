// src/graphql/inputs/QueryActionCategoriesByOrganizationInput.ts

// Import Zod for runtime validation
import { z } from "zod";

// Import GraphQL schema builder (Pothos)
import { builder } from "~/src/graphql/builder";

/**
 * 🔹 1️⃣ Zod schema for validating input when querying by organization
 * Ensures that the `organizationId` is a valid UUID string.
 */
export const queryActionCategoriesByOrganizationInputSchema = z.object({
	organizationId: z
		.string()
		.uuid({ message: "Invalid Organization ID format" }),
});

/**
 * 🔹 2️⃣ GraphQL input type definition using builder.inputType
 * Describes the input type for the GraphQL query.
 */
export const QueryActionCategoriesByOrganizationInput = builder.inputType(
	"QueryActionCategoriesByOrganizationInput",
	{
		description:
			"Input object for querying action item categories by a specific organization.",
		fields: (t) => ({
			// Required ID of the organization whose categories are being queried
			organizationId: t.id({
				description:
					"Global identifier of the organization whose action item categories you want to fetch.",
				required: true,
			}),
		}),
	},
);

/**
 * 🔹 3️⃣ Wrapper schema for GraphQL query arguments
 * This wraps the input under a top-level `input` field,
 * matching the standard GraphQL query argument pattern.
 */
export const queryActionCategoriesByOrganizationArgumentsSchema = z.object({
	input: queryActionCategoriesByOrganizationInputSchema,
});
