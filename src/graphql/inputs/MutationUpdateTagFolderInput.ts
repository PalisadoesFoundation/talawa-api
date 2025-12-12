import type { z } from "zod";
import { tagFoldersTableInsertSchema } from "~/src/drizzle/tables/tagFolders";
import { builder } from "~/src/graphql/builder";
import { sanitizedStringSchema } from "~/src/utilities/sanitizer";

export const mutationUpdateTagFolderInputSchema = tagFoldersTableInsertSchema
	.pick({
		parentFolderId: true,
	})
	.extend({
		id: tagFoldersTableInsertSchema.shape.id.unwrap(),
		// Use sanitizedStringSchema to store raw name, escaping is done at output time.
		name: sanitizedStringSchema.min(1).max(256).optional(),
	})
	.refine(
		({ id, ...remainingArg }) =>
			Object.values(remainingArg).some((value) => value !== undefined),
		{
			message: "At least one optional argument must be provided.",
		},
	);

export const MutationUpdateTagFolderInput = builder
	.inputRef<z.infer<typeof mutationUpdateTagFolderInputSchema>>(
		"MutationUpdateTagFolderInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the tag folder.",
				required: true,
			}),
			name: t.string({
				description: "Name of the tag folder.",
				required: false,
			}),
			parentFolderId: t.id({
				description: "Global identifier of associated parent tag folder.",
				required: false,
			}),
		}),
	});
