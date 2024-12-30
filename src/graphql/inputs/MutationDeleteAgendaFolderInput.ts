import { z } from "zod";
import { agendaFoldersTableInsertSchema } from "~/src/drizzle/tables/agendaFolders";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteAgendaFolderInputSchema = z.object({
	id: agendaFoldersTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteAgendaFolderInput = builder
	.inputRef<z.infer<typeof mutationDeleteAgendaFolderInputSchema>>(
		"MutationDeleteAgendaFolderInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the agenda folder.",
				required: true,
			}),
		}),
	});
