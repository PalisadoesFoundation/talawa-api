import { z } from "zod";
import { tagFoldersTableInsertSchema } from "~/src/drizzle/tables/tagFolders";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteTagFolderInputSchema = z.object({
	id: tagFoldersTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteTagFolderInput = builder
	.inputRef<z.infer<typeof mutationDeleteTagFolderInputSchema>>(
		"MutationDeleteTagFolderInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the tag folder.",
				required: true,
			}),
		}),
	});
