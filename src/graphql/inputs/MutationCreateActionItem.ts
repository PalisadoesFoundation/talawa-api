// Import Zod for runtime input validation
import { z } from "zod";

// Import builder for GraphQL schema construction
import { builder } from "~/src/graphql/builder";

/**
 * Zod schema used to validate the input for creating a new action item.
 * Ensures type safety and proper formatting at runtime.
 */
export const mutationCreateActionItemInputSchema = z.object({
	// ID of the category the action item belongs to
	categoryId: z.string().uuid(),

	// ID of the user assigned to the action item
	assigneeId: z.string().uuid(),

	// Optional notes shown before task completion
	preCompletionNotes: z.string().optional(),

	// Optional event ID this action item is linked to
	eventId: z.string().uuid().optional(),

	// ID of the organization creating the action item
	organizationId: z.string().uuid(),

	// Optional ISO timestamp string for assignment date
	assignedAt: z.string().optional(),

	// Optional estimated hours to complete the task; must be a non-negative integer
	allottedHours: z.number().int().nonnegative().optional(),
});

/**
 * GraphQL Input Type: MutationCreateActionItemInput
 * Exposes fields in GraphQL schema using builder with descriptions and validation.
 */
export const MutationCreateActionItemInput = builder
	.inputRef<z.infer<typeof mutationCreateActionItemInputSchema>>(
		"MutationCreateActionItemInput",
	)
	.implement({
		description:
			"All inputs needed to create a new action item within an organization.",
		fields: (t) => ({
			// Required: ID of the category this action item belongs to
			categoryId: t.id({
				description:
					"Global ID of the category under which this action item is classified.",
				required: true,
			}),

			// Required: ID of the user who will be assigned this item
			assigneeId: t.id({
				description:
					"Global ID of the user (or group) to whom this action item will be assigned.",
				required: true,
			}),

			// Optional: Instructions or notes visible before task completion
			preCompletionNotes: t.string({
				description:
					"Optional notes or instructions to display before the action item is completed.",
				required: false,
			}),

			// Optional: ID of the related event, if any
			eventId: t.id({
				description:
					"Optional ID of the event this action item is associated with, if any.",
				required: false,
			}),

			// Required: Organization under which the item is being created
			organizationId: t.id({
				description:
					"Global ID of the organization under which this action item is created.",
				required: true,
			}),

			// Optional: ISO date string indicating when the task was assigned
			assignedAt: t.string({
				description:
					"Optional ISO‑formatted date string indicating when the action item was assigned (defaults to now).",
				required: false,
			}),

			// Optional: Estimated number of hours to complete; must be ≥ 0
			allottedHours: t.int({
				description:
					"Optional number of whole hours estimated to complete this action item (must be ≥ 0).",
				required: false,
			}),
		}),
	});

/**
 * Wraps the input inside a GraphQL `input` argument object.
 * Used in the mutation argument definition.
 */
export const mutationCreateActionItemArgumentsSchema = z.object({
	input: mutationCreateActionItemInputSchema,
});
