import { eq } from "drizzle-orm";
import { agendaItemUrlTable } from "~/src/drizzle/tables/agendaItemUrls";
import envConfig from "~/src/utilities/graphqLimits";
import { AgendaItemUrl } from "../AgendaItemUrl.ts/AgendaItemUrl";
import { AgendaItem } from "./AgendaItem";

AgendaItem.implement({
	fields: (t) => ({
		url: t.field({
			description: "Url for the agenda item",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: async (parent, _args, ctx) => {
				const existingUrl =
					await ctx.drizzleClient.query.agendaItemUrlTable.findMany({
						where: eq(agendaItemUrlTable.agendaItemId, parent.id),
					});
				return existingUrl;
			},
			type: [AgendaItemUrl],
		}),
	}),
});
