// Import Zod for runtime input validation
import { z } from "zod";

// Import schema field from Drizzle ORM definition of the ActionItems table
import { actionsTableInsertSchema } from "~/src/drizzle/tables/actionItems";

// Import Pothos GraphQL schema builder
import { builder } from "~/src/graphql/builder";

/**
 * 🔹 1️⃣ Zod schema for validating input to query ActionItems by organization
 * - Uses the `organizationId` field shape directly from the Drizzle table schema for consistency.
 */
export const queryActionItemsByOrgInputSchema = z.object({
	organizationId: actionsTableInsertSchema.shape.organizationId,
});

/**
 * 🔹 2️⃣ Pothos GraphQL Input Type definition
 * - Creates a strongly typed GraphQL input type for the query using Pothos.
 */
export const QueryActionItemsByOrganizationInput = builder
	.inputRef<z.infer<typeof queryActionItemsByOrgInputSchema>>(
		"QueryActionItemsByOrganizationInput",
	)
	.implement({
		description: "Input schema for querying ActionItems by organizationId.",
		fields: (t) => ({
			// Required: ID of the organization to filter ActionItems
			organizationId: t.string({
				description: "ID of the organization to fetch associated action items.",
				required: true,
			}),
		}),
	});

/**
 * 🔹 3️⃣ Arguments wrapper schema for GraphQL queries
 * - Wraps the actual input in a `{ input: {...} }` object to follow common GraphQL argument conventions.
 */
export const queryActionItemsByOrganizationArgumentsSchema = z.object({
	input: queryActionItemsByOrgInputSchema,
});
