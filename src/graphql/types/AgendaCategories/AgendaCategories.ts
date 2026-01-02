import type { agendaCategoriesTable } from "~/src/drizzle/tables/agendaCategories";
import { builder } from "~/src/graphql/builder";

export type AgendaCategory = typeof agendaCategoriesTable.$inferSelect;

export const AgendaCategory =
	builder.objectRef<AgendaCategory>("AgendaCategory");

AgendaCategory.implement({
	description:
		"Agenda Categories for the agenda items",
	fields: (t) => ({
		description: t.exposeString("description", {
			description: "Custom information about the agenda categories.",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the agenda categories.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the agenda categories.",
		}),
		isDefaultCategory: t.exposeBoolean("isDefaultCategory", {
			description: "Boolean to tell if agenda category is default or not",
		}),
	}),
});
