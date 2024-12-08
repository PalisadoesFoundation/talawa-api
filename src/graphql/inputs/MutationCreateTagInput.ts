import type { z } from "zod";
import { tagsTableInsertSchema } from "~/src/drizzle/tables/tags";
import { builder } from "~/src/graphql/builder";

export const mutationCreateTagInputSchema = tagsTableInsertSchema.pick({
	isFolder: true,
	name: true,
	organizationId: true,
	parentTagId: true,
});

export const MutationCreateTagInput = builder
	.inputRef<z.infer<typeof mutationCreateTagInputSchema>>(
		"MutationCreateTagInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			isFolder: t.boolean({
				description:
					"Boolean to tell if the tag is to be used as a tag folder.",
				required: true,
			}),
			name: t.string({
				description: "Name of the tag.",
				required: true,
			}),
			organizationId: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
			parentTagId: t.id({
				description: "Global identifier of the parent tag.",
			}),
		}),
	});
