import type { z } from "zod";
import { tagFoldersTableInsertSchema } from "~/src/drizzle/tables/tagFolders";
import { builder } from "~/src/graphql/builder";

export const mutationCreateTagFolderInputSchema =
	tagFoldersTableInsertSchema.pick({
		name: true,
		organizationId: true,
		parentFolderId: true,
	});

export const MutationCreateTagFolderInput = builder
	.inputRef<z.infer<typeof mutationCreateTagFolderInputSchema>>(
		"MutationCreateTagFolderInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			name: t.string({
				description: "Name of the tag.",
				required: true,
			}),
			organizationId: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
			parentFolderId: t.id({
				description: "Global identifier of the associated parent tag folder.",
			}),
		}),
	});
