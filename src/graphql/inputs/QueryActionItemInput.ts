import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Defines the Zod validation schema for querying ActionItems by organizationId.
 */
export const queryActionItemsByOrgInputSchema = z.object({
	organizationId: z.string().uuid(), // Required UUID string
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
 * Defines the Zod validation schema for querying ActionItems by volunteerId.
 */
export const queryActionItemsByVolunteerInputSchema = z.object({
	volunteerId: z.string().uuid(), // Required UUID string
	organizationId: z.string().uuid().optional(), // Optional org filter
});

/**
 * GraphQL Input Type for querying ActionItems by volunteerId.
 */
export const QueryActionItemsByVolunteerInput = builder
	.inputRef<z.infer<typeof queryActionItemsByVolunteerInputSchema>>(
		"QueryActionItemsByVolunteerInput",
	)
	.implement({
		description:
			"Input schema for querying ActionItems assigned to a volunteer.",
		fields: (t) => ({
			volunteerId: t.string({
				description: "ID of the volunteer to fetch assigned action items for.",
				required: true,
			}),
			organizationId: t.string({
				description: "Optional ID of organization to filter action items by.",
			}),
		}),
	});

/**
 * Defines the Zod validation schema for querying ActionItems by volunteerGroupId.
 */
export const queryActionItemsByVolunteerGroupInputSchema = z.object({
	volunteerGroupId: z.string().uuid(), // Required UUID string
	organizationId: z.string().uuid().optional(), // Optional org filter
});

/**
 * GraphQL Input Type for querying ActionItems by volunteerGroupId.
 */
export const QueryActionItemsByVolunteerGroupInput = builder
	.inputRef<z.infer<typeof queryActionItemsByVolunteerGroupInputSchema>>(
		"QueryActionItemsByVolunteerGroupInput",
	)
	.implement({
		description:
			"Input schema for querying ActionItems assigned to a volunteer group.",
		fields: (t) => ({
			volunteerGroupId: t.string({
				description:
					"ID of the volunteer group to fetch assigned action items for.",
				required: true,
			}),
			organizationId: t.string({
				description: "Optional ID of organization to filter action items by.",
			}),
		}),
	});
