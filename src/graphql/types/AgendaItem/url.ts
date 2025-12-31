import { agendaItemUrlTable } from "~/src/drizzle/tables/agendaItemUrls";
import { AgendaItem } from "./AgendaItem";
import { AgendaItemUrl } from "../AgendaItemUrl.ts/AgendaItemUrl";
import { eq } from "drizzle-orm";



AgendaItem.implement({
    fields: (t) => ({
        url: t.field({
            description : "Url for the agenda item",
            resolve: async (parents, _args, ctx) => {
                const existingUrl = await ctx.drizzleClient.query.agendaItemUrlTable.findMany({
                    where: eq(agendaItemUrlTable.agendaItemId, parents.id)
                })
            return existingUrl                
            },
            type: [AgendaItemUrl]
        })
    })
})