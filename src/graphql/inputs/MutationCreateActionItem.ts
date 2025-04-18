import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const mutationCreateActionItemInputSchema = z.object({
	categoryId: z.string().uuid(),
	assigneeId: z.string().uuid(),
	preCompletionNotes: z.string().optional(),
	eventId: z.string().uuid().optional(),
	organizationId: z.string().uuid(),
	assignedAt: z.string().optional(),
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
		}),
	});

export const mutationCreateActionItemArgumentsSchema = z.object({
	input: mutationCreateActionItemInputSchema,
});
