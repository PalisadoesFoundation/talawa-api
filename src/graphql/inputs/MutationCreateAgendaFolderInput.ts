import type { z } from "zod";
import { agendaFoldersTableInsertSchema } from "~/src/drizzle/tables/agendaFolders";
import { builder } from "~/src/graphql/builder";

export const mutationCreateAgendaFolderInputSchema =
	agendaFoldersTableInsertSchema.pick({
		eventId: true,
		isAgendaItemFolder: true,
		name: true,
		parentFolderId: true,
	});

export const MutationCreateAgendaFolderInput = builder
	.inputRef<z.infer<typeof mutationCreateAgendaFolderInputSchema>>(
		"MutationCreateAgendaFolderInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			eventId: t.id({
				description:
					"Global identifier of the event the agenda folder is associated to.",
				required: true,
			}),
			isAgendaItemFolder: t.boolean({
				description:
					"Boolean to tell if the agenda folder is meant to be a folder for agenda items or a parent folder for other agenda folders.",
				required: true,
			}),
			name: t.string({
				description: "Name of the agenda folder.",
				required: true,
			}),
			parentFolderId: t.id({
				description:
					"Global identifier of the agenda folder the agenda folder is contained within.",
			}),
		}),
	});
