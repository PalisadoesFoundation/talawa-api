import { eq } from "drizzle-orm";
import { agendaItemAttachmentsTable } from "~/src/drizzle/tables/agendaItemAttachment";
import { AgendaItemAttachment } from "../AgendaItemAttachment.ts/AgendaItemAttachment";
import { AgendaItem } from "./AgendaItem";

AgendaItem.implement({
	fields: (t) => ({
		attachment: t.field({
			description: "Attachments for the agenda item",
			resolve: async (parents, _args, ctx) => {
				const existingAttachments =
					await ctx.drizzleClient.query.agendaItemAttachmentsTable.findMany({
						where: eq(agendaItemAttachmentsTable.agendaItemId, parents.id),
					});
				return existingAttachments;
			},
			type: [AgendaItemAttachment],
		}),
	}),
});
