import { z } from "zod";
import { postsTableInsertSchema } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";

export const mutationDeletePostInputSchema = z.object({
	id: postsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeletePostInput = builder
	.inputRef<z.infer<typeof mutationDeletePostInputSchema>>(
		"MutationDeletePostInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the post.",
				required: true,
			}),
		}),
	});
