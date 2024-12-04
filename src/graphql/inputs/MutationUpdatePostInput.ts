import { z } from "zod";
import { postsTableInsertSchema } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";

export const mutationUpdatePostInputSchema = z
	.object({
		caption: postsTableInsertSchema.shape.caption.optional(),
		id: postsTableInsertSchema.shape.id.unwrap(),
		isPinned: z.boolean().optional(),
	})
	.refine(
		({ id, ...remainingArg }) =>
			Object.values(remainingArg).some((value) => value !== undefined),
		{
			message: "At least one optional argument must be provided.",
		},
	);

export const MutationUpdatePostInput = builder
	.inputRef<z.infer<typeof mutationUpdatePostInputSchema>>(
		"MutationUpdatePostInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			caption: t.string({
				description: "Caption about the post.",
			}),
			id: t.id({
				description: "Global identifier of the post.",
				required: true,
			}),
			isPinned: t.boolean({
				description: "Boolean to tell if the post is pinned",
			}),
		}),
	});
