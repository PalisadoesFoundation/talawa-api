import type { agendaItemUrlTable } from "~/src/drizzle/tables/agendaItemUrls";
import { builder } from "~/src/graphql/builder";

/**
 * TypeScript type representing an agenda item URL record.
 * Inferred from the agendaItemUrls database table schema.
 */
export type AgendaItemUrl = typeof agendaItemUrlTable.$inferSelect;

/**
 * GraphQL object reference for AgendaItemUrl type.
 * Used to define the GraphQL schema for URLs associated with agenda items.
 */
export const AgendaItemUrl = builder.objectRef<AgendaItemUrl>("AgendaItemUrl");

AgendaItemUrl.implement({
	description: "URLs associated with an agenda item.",
	fields: (t) => ({
		id: t.exposeID("id", {
			description: "Global identifier of the agenda item URL.",
			nullable: false,
		}),

		url: t.exposeString("agendaItemURL", {
			description: "URL associated with the agenda item.",
			nullable: true,
		}),

		createdAt: t.expose("createdAt", {
			type: "DateTime",
			description: "Date time at which the URL was created.",
			nullable: false,
		}),

		updatedAt: t.expose("updatedAt", {
			type: "DateTime",
			nullable: true,
			description: "Date time at which the URL was last updated.",
		}),
	}),
});
