import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const mutationCreateActionItemInputSchema = z.object({
	categoryId: z.string().uuid(),
	assigneeId: z.string().uuid(),
	preCompletionNotes: z.string().optional(),
	eventId: z.string().uuid().optional(),
	organizationId: z.string().uuid(),
	assignedAt: z.string().optional(),
	allottedHours: z.number().int().nonnegative().optional(), // ← enforce integer ≥ 0
});

export const MutationCreateActionItemInput = builder
	.inputRef<z.infer<typeof mutationCreateActionItemInputSchema>>(
		"MutationCreateActionItemInput",
	)
	.implement({
		description:
			"All inputs needed to create a new action item within an organization.",
		fields: (t) => ({
			categoryId: t.id({
				description:
					"Global ID of the category under which this action item is classified.",
				required: true,
			}),
			assigneeId: t.id({
				description:
					"Global ID of the user (or group) to whom this action item will be assigned.",
				required: true,
			}),
			preCompletionNotes: t.string({
				description:
					"Optional notes or instructions to display before the action item is completed.",
				required: false,
			}),
			eventId: t.id({
				description:
					"Optional ID of the event this action item is associated with, if any.",
				required: false,
			}),
			organizationId: t.id({
				description:
					"Global ID of the organization under which this action item is created.",
				required: true,
			}),
			assignedAt: t.string({
				description:
					"Optional ISO‑formatted date string indicating when the action item was assigned (defaults to now).",
				required: false,
			}),
			allottedHours: t.int({
				description:
					"Optional number of whole hours estimated to complete this action item (must be ≥ 0).",
				required: false,
			}),
		}),
	});

export const mutationCreateActionItemArgumentsSchema = z.object({
	input: mutationCreateActionItemInputSchema,
});
