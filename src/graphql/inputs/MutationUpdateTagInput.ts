import type { z } from "zod";
import { tagsTableInsertSchema } from "~/src/drizzle/tables/tags";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateTagInputSchema = tagsTableInsertSchema
	.pick({
		folderId: true,
	})
	.extend({
		id: tagsTableInsertSchema.shape.id.unwrap(),
		name: tagsTableInsertSchema.shape.name.optional(),
	})
	.refine(
		({ id, ...remainingArg }) =>
			Object.values(remainingArg).some((value) => value !== undefined),
		{
			message: "At least one optional argument must be provided.",
		},
	);

export const MutationUpdateTagInput = builder
	.inputRef<z.infer<typeof mutationUpdateTagInputSchema>>(
		"MutationUpdateTagInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			folderId: t.id({
				description: "Global identifier of associated tag folder.",
			}),
			id: t.id({
				description: "Global identifier of the tag.",
				required: true,
			}),
			name: t.string({
				description: "Name of the tag.",
			}),
		}),
	});
