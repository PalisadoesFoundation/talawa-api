import type { z } from "zod";
import { agendaFoldersTableInsertSchema } from "~/src/drizzle/tables/agendaFolders";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateAgendaFolderInputSchema =
	agendaFoldersTableInsertSchema
		.pick({
			parentFolderId: true,
		})
		.extend({
			id: agendaFoldersTableInsertSchema.shape.id.unwrap(),
			name: agendaFoldersTableInsertSchema.shape.name.optional(),
		})
		.refine(
			({ id, ...remainingArg }) =>
				Object.values(remainingArg).some((value) => value !== undefined),
			{
				message: "At least one optional argument must be provided.",
			},
		);

export const MutationUpdateAgendaFolderInput = builder
	.inputRef<z.infer<typeof mutationUpdateAgendaFolderInputSchema>>(
		"MutationUpdateAgendaFolderInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the agenda folder.",
				required: true,
			}),
			name: t.string({
				description: "Name of the agenda folder.",
			}),
			parentFolderId: t.id({
				description:
					"Global identifier of the agenda folder the agenda folder is contained within.",
			}),
		}),
	});
