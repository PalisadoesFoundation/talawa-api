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
		description: "Input fields required for creating an action item.",
		fields: (t) => ({
			categoryId: t.id({ required: true }),
			assigneeId: t.id({ required: true }),
			preCompletionNotes: t.string({ required: false }),
			eventId: t.id({ required: false }),
			organizationId: t.id({ required: true }),
			assignedAt: t.string({ required: false }),
			allottedHours: t.int({
				// ← use Int here
				description: "Number of whole hours allotted to this item",
				required: false,
			}),
		}),
	});

export const mutationCreateActionItemArgumentsSchema = z.object({
	input: mutationCreateActionItemInputSchema,
});
