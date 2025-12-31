import { agendaItemAttachmentsTable } from "~/src/drizzle/tables/agendaItemAttachment";
import { AgendaItem } from "./AgendaItem";
import { eq } from "drizzle-orm";
import { AgendaItemAttachment } from "../AgendaItemAttachment.ts/AgendaItemAttachment";



AgendaItem.implement({
    fields: (t) => ({
        attachment: t.field({
            description : "Attachments for the agenda item",
            resolve: async (parents, _args, ctx) => {
                const existingAttachments = await ctx.drizzleClient.query.agendaItemAttachmentsTable.findMany({
                    where: eq(agendaItemAttachmentsTable.agendaItemId, parents.id)
                })
            return existingAttachments              
            },
            type: [AgendaItemAttachment]
        })
    })
})