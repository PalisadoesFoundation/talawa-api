import { z } from "zod";
import { agendaFoldersTableInsertSchema } from "~/src/drizzle/tables/agendaFolders";
import { builder } from "~/src/graphql/builder";

export const queryAgendaFolderInputSchema = z.object({
	id: agendaFoldersTableInsertSchema.shape.id.unwrap(),
});

export const QueryAgendaFolderInput = builder
	.inputRef<z.infer<typeof queryAgendaFolderInputSchema>>(
		"QueryAgendaFolderInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the agenda folder.",
				required: true,
			}),
		}),
	});
