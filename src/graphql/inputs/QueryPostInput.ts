import { z } from "zod";
import { postsTableInsertSchema } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";

export const queryPostInputSchema = z.object({
	id: postsTableInsertSchema.shape.id.unwrap(),
});

export const QueryPostInput = builder
	.inputRef<z.infer<typeof queryPostInputSchema>>("QueryPostInput")
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the post.",
				required: true,
			}),
		}),
	});
