import { z } from "zod";
import { tagFoldersTableInsertSchema } from "~/src/drizzle/tables/tagFolders";
import { builder } from "~/src/graphql/builder";

export const queryTagFolderInputSchema = z.object({
	id: tagFoldersTableInsertSchema.shape.id.unwrap(),
});

export const QueryTagFolderInput = builder
	.inputRef<z.infer<typeof queryTagFolderInputSchema>>("QueryTagFolderInput")
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the tag folder.",
				required: true,
			}),
		}),
	});
