import { eq } from "drizzle-orm";
import { agendaItemUrlTable } from "~/src/drizzle/tables/agendaItemUrls";
import { AgendaItemUrl } from "../AgendaItemUrl.ts/AgendaItemUrl";
import { AgendaItem } from "./AgendaItem";

AgendaItem.implement({
	fields: (t) => ({
		url: t.field({
			description: "Url for the agenda item",
			resolve: async (parents, _args, ctx) => {
				const existingUrl =
					await ctx.drizzleClient.query.agendaItemUrlTable.findMany({
						where: eq(agendaItemUrlTable.agendaItemId, parents.id),
					});
				return existingUrl;
			},
			type: [AgendaItemUrl],
		}),
	}),
});
