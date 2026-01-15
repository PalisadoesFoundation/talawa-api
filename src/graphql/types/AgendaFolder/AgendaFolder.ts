import type { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { builder } from "~/src/graphql/builder";

export type AgendaFolder = typeof agendaFoldersTable.$inferSelect;

export const AgendaFolder = builder.objectRef<AgendaFolder>("AgendaFolder");

AgendaFolder.implement({
	description:
		"Agenda folders are used to contain either collections of agenda items or collections of agenda folders but not both at the same time. Together with agenda items they constitute the agenda for an event.",
	fields: (t) => ({
		description: t.exposeString("description", {
			description: "Custom information about the agenda folder.",
			nullable: true,
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the agenda folder.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the agenda folder.",
		}),
		sequence: t.exposeInt("sequence", {
			description: "Sequence of agenda folder.",
			nullable: true,
		}),
		isDefaultFolder: t.exposeBoolean("isDefaultFolder", {
			description: "Boolean to tell if agenda folder is default or not",
			nullable: false,
		}),
	}),
});
