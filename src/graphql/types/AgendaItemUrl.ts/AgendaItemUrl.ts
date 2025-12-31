import type { agendaItemUrlTable } from "~/src/drizzle/tables/agendaItemUrls";
import { builder } from "~/src/graphql/builder";

export type AgendaItemUrl = typeof agendaItemUrlTable.$inferSelect;

export const AgendaItemUrl =
    builder.objectRef<AgendaItemUrl>("AgendaItemUrl");

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
    }),

    updatedAt: t.expose("updatedAt", {
      type: "DateTime",
      nullable: true,
      description: "Date time at which the URL was last updated.",
    }),
  }),
});

