import type { z } from "zod";
import { agendaFoldersTableInsertSchema } from "~/src/drizzle/tables/agendaFolders";
import { builder } from "~/src/graphql/builder";

export const mutationCreateAgendaFolderInputSchema =
	agendaFoldersTableInsertSchema.pick({
		eventId: true,
		name: true,
		organizationId: true,
		description: true,
		sequence: true,
	});

export const MutationCreateAgendaFolderInput = builder
	.inputRef<z.infer<typeof mutationCreateAgendaFolderInputSchema>>(
		"MutationCreateAgendaFolderInput",
	)
	.implement({
		description: "Input type for creating a new agenda folder.",
		fields: (t) => ({
			description: t.string({
				description: "Description of Agenda Folder",
			}),
			eventId: t.id({
				description:
					"Global identifier of the event the agenda folder is associated to.",
				required: true,
			}),
			name: t.string({
				description: "Name of the agenda folder.",
				required: true,
			}),
			organizationId: t.id({
				description: "ID of the organization this folder belongs to.",
				required: true,
			}),
			sequence: t.int({
				description: "Sequence of the Agenda Folder.",
				required: true,
			}),
		}),
	});
