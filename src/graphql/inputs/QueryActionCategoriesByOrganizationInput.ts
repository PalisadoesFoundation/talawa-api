// src/graphql/inputs/QueryActionCategoriesByOrganizationInput.ts

import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * 1️⃣ Zod schema for validating organizationId input
 */
export const queryActionCategoriesByOrganizationInputSchema = z.object({
	organizationId: z
		.string()
		.uuid({ message: "Invalid Organization ID format" }),
});

/**
 * 2️⃣ Pothos GraphQL input type definition
 */
export const QueryActionCategoriesByOrganizationInput = builder.inputType(
	"QueryActionCategoriesByOrganizationInput",
	{
		description:
			"Input object for querying action item categories by a specific organization.",
		fields: (t) => ({
			organizationId: t.id({
				description:
					"Global identifier of the organization whose action item categories you want to fetch.",
				required: true,
			}),
		}),
	},
);

/**
 * 3️⃣ Arguments schema to wrap the input (optional for consistency)
 */

export const queryActionCategoriesByOrganizationArgumentsSchema = z.object({
	input: queryActionCategoriesByOrganizationInputSchema,
});
