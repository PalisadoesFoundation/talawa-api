import { z } from "zod";
import { tagsTableInsertSchema } from "~/src/drizzle/tables/tags";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteTagInputSchema = z.object({
	id: tagsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteTagInput = builder
	.inputRef<z.infer<typeof mutationDeleteTagInputSchema>>(
		"MutationDeleteTagInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the tag.",
				required: true,
			}),
		}),
	});
