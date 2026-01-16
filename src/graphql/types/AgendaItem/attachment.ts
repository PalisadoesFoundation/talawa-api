import { eq } from "drizzle-orm";
import { agendaItemAttachmentsTable } from "~/src/drizzle/tables/agendaItemAttachments";
import envConfig from "~/src/utilities/graphqLimits";
import { AgendaItemAttachment } from "../AgendaItemAttachment/AgendaItemAttachment";
import { AgendaItem } from "./AgendaItem";

AgendaItem.implement({
	fields: (t) => ({
		attachments: t.field({
			description: "Attachments for the agenda item",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: async (parent, _args, ctx) => {
				const existingAttachments =
					await ctx.drizzleClient.query.agendaItemAttachmentsTable.findMany({
						where: eq(agendaItemAttachmentsTable.agendaItemId, parent.id),
					});
				return existingAttachments;
			},
			type: [AgendaItemAttachment],
		}),
	}),
});
