import { z } from "zod";
import { actionsTableInsertSchema } from "~/src/drizzle/tables/actions";
import { builder } from "~/src/graphql/builder";

/**
 * 1️⃣ Zod validation schema for querying ActionItems by organizationId
 */
export const queryActionItemsByOrgInputSchema = z.object({
	organizationId: actionsTableInsertSchema.shape.organizationId,
});

/**
 * 2️⃣ Pothos GraphQL Input Type for querying ActionItems
 */
export const QueryActionItemsByOrganizationInput = builder
	.inputRef<z.infer<typeof queryActionItemsByOrgInputSchema>>(
		"QueryActionItemsByOrganizationInput",
	)
	.implement({
		description: "Input schema for querying ActionItems by organizationId.",
		fields: (t) => ({
			organizationId: t.string({
				description: "ID of the organization to fetch associated action items.",
				required: true,
			}),
		}),
	});

/**
 * 3️⃣ Top-level wrapper used for validating `{ input: … }`
 */
export const queryActionItemsByOrganizationArgumentsSchema = z.object({
	input: queryActionItemsByOrgInputSchema,
});
