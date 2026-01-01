import type { agendaCategoriesTable } from "~/src/drizzle/tables/agendaCategories";
import { builder } from "~/src/graphql/builder";

export type AgendaCategory = typeof agendaCategoriesTable.$inferSelect;

export const AgendaCategory =
	builder.objectRef<AgendaCategory>("AgendaCategory");

AgendaCategory.implement({
	description:
		"Agenda folders are used to contain either collections of agenda items or collections of agenda folders but not both at the same time. Together with agenda items they constitute the agenda for an event.",
	fields: (t) => ({
		description: t.exposeString("description", {
			description: "Custom information about the agenda folder.",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the agenda folder.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the agenda folder.",
		}),
		isDefaultCategory: t.exposeBoolean("isDefaultCategory", {
			description: "Boolean to tell if agenda category is default or not",
		}),
	}),
});
