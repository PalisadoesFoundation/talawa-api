import { z } from "zod";
import { actionsTableInsertSchema } from "~/src/drizzle/tables/actions"; // ✅ Now imported successfully
import { builder } from "~/src/graphql/builder";

/**
 * Defines the Zod validation schema for querying ActionItems by organizationId.
 */
export const queryActionItemsByOrgInputSchema = z.object({
	organizationId: actionsTableInsertSchema.shape.organizationId,
});

/**
 * GraphQL Input Type for querying ActionItems by organizationId.
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