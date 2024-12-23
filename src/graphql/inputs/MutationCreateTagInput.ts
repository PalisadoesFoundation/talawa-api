import type { z } from "zod";
import { tagsTableInsertSchema } from "~/src/drizzle/tables/tags";
import { builder } from "~/src/graphql/builder";

export const mutationCreateTagInputSchema = tagsTableInsertSchema.pick({
	folderId: true,
	name: true,
	organizationId: true,
});

export const MutationCreateTagInput = builder
	.inputRef<z.infer<typeof mutationCreateTagInputSchema>>(
		"MutationCreateTagInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			folderId: t.id({
				description: "Global identifier of the associated tag folder.",
			}),
			name: t.string({
				description: "Name of the tag.",
				required: true,
			}),
			organizationId: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
		}),
	});
