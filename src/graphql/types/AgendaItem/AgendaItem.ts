import { agendaItemTypeEnum } from "~/src/drizzle/enums/agendaItemType";
import type { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
import { builder } from "~/src/graphql/builder";
import { AgendaItemType } from "~/src/graphql/enums/AgendaItemType";
import { escapeHTML } from "~/src/utilities/sanitizer";

export type AgendaItem = typeof agendaItemsTable.$inferSelect;

export const AgendaItem = builder.objectRef<AgendaItem>("AgendaItem");

AgendaItem.implement({
	description:
		"Agenda items contain the important information about agenda for the associated event.",
	fields: (t) => ({
		description: t.string({
			description: "Custom information about the agenda item.",
			resolve: (parent) =>
				parent.description ? escapeHTML(parent.description) : null,
		}),
		duration: t.exposeString("duration", {
			description: "Duration of the agenda item.",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the agenda item.",
			nullable: false,
		}),
		key: t.exposeString("key", {
			description: `Key of the agenda item if it's of a "song" type. More information at [this](https://en.wikipedia.org/wiki/Key_(music)) link.`,
		}),
		name: t.string({
			description: "Name of the agenda item.",
			resolve: (parent) => escapeHTML(parent.name),
		}),
		notes: t.string({
			description: "Notes for the agenda item.",
			nullable: true,
			resolve: (parent) => (parent.notes ? escapeHTML(parent.notes) : null),
		}),
		sequence: t.exposeInt("sequence", {
			description: "Sequence order of the agenda item.",
		}),
		type: t.field({
			description: "Type of the agenda item.",
			resolve: (parent) => agendaItemTypeEnum.parse(parent.type),
			type: AgendaItemType,
		}),
	}),
});
