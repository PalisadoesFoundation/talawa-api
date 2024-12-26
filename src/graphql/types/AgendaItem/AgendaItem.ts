import type { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
import { builder } from "~/src/graphql/builder";
import { AgendaItemType } from "~/src/graphql/enums/AgendaItemType";

export type AgendaItem = typeof agendaItemsTable.$inferSelect;

export const AgendaItem = builder.objectRef<AgendaItem>("AgendaItem");

AgendaItem.implement({
	description: "",
	fields: (t) => ({
		description: t.exposeString("description", {
			description: "Custom information about the agenda item.",
		}),
		duration: t.exposeString("duration", {
			description: "Duration of the agenda item.",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the agenda item.",
			nullable: false,
		}),
		key: t.exposeString("key", {
			description: `Key of the agenda item if it's type is "song". More information at [this](https://en.wikipedia.org/wiki/Key_(music)) link.`,
		}),
		name: t.exposeString("name", {
			description: "Name of the agenda item.",
		}),
		type: t.expose("type", {
			description: "Type of the agenda item.",
			type: AgendaItemType,
		}),
	}),
});
