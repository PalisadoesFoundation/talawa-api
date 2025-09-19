import { z } from "zod";
import { actionItemsTableInsertSchema } from "~/src/drizzle/tables/actionItems";
import { builder } from "~/src/graphql/builder";

/**
 * Defines the Zod validation schema for querying ActionItems by organizationId.
 */
export const queryActionItemsByOrgInputSchema = z.object({
	organizationId: actionItemsTableInsertSchema.shape.organizationId,
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

/**
 * Defines the Zod validation schema for querying ActionItems by userId.
 */
export const queryActionItemsByUserInputSchema = z.object({
	userId: actionItemsTableInsertSchema.shape.assigneeId.unwrap(), // Make userId required
	organizationId: actionItemsTableInsertSchema.shape.organizationId.optional(), // Optional org filter
});

/**
 * GraphQL Input Type for querying ActionItems by userId.
 */
export const QueryActionItemsByUserInput = builder
	.inputRef<z.infer<typeof queryActionItemsByUserInputSchema>>(
		"QueryActionItemsByUserInput",
	)
	.implement({
		description: "Input schema for querying ActionItems assigned to a user.",
		fields: (t) => ({
			userId: t.string({
				description: "ID of the user to fetch assigned action items for.",
				required: true,
			}),
			organizationId: t.string({
				description: "Optional ID of organization to filter action items by.",
			}),
		}),
	});
