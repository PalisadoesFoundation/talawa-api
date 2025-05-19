import { z } from "zod";
import { tagsTableInsertSchema } from "~/src/drizzle/tables/tags";
import { builder } from "~/src/graphql/builder";

export const queryTagInputSchema = z.object({
	id: tagsTableInsertSchema.shape.id.unwrap(),
});

export const QueryTagInput = builder
	.inputRef<z.infer<typeof queryTagInputSchema>>("QueryTagInput")
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the tag.",
				required: true,
			}),
		}),
	});
