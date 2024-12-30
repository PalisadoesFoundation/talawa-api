import type { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { builder } from "~/src/graphql/builder";

export type AgendaFolder = typeof agendaFoldersTable.$inferSelect;

export const AgendaFolder = builder.objectRef<AgendaFolder>("AgendaFolder");

AgendaFolder.implement({
	description: "",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Global identifier of the agenda folder.",
			nullable: false,
		}),
		isAgendaItemFolder: t.exposeBoolean("isAgendaItemFolder", {
			description:
				"Boolean to tell if the agenda folder is meant to be a folder for agenda items or a parent for agenda folders.",
		}),
		name: t.exposeString("name", {
			description: "Name of the agenda folder.",
		}),
	}),
});
