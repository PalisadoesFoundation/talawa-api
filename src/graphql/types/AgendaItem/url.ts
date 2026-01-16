import { eq } from "drizzle-orm";
import { agendaItemUrlTable } from "~/src/drizzle/tables/agendaItemUrls";
import type { GraphQLContext } from "~/src/graphql/context";
import envConfig from "~/src/utilities/graphqLimits";
import { AgendaItemUrl } from "../AgendaItemUrl/AgendaItemUrl";
import type { AgendaItem as AgendaItemType } from "./AgendaItem";
import { AgendaItem } from "./AgendaItem";

// Exported resolver for unit testing
export const resolveUrl = async (
	parent: AgendaItemType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	const existingUrl = await ctx.drizzleClient.query.agendaItemUrlTable.findMany(
		{
			where: eq(agendaItemUrlTable.agendaItemId, parent.id),
		},
	);

	return existingUrl;
};

AgendaItem.implement({
	fields: (t) => ({
		url: t.field({
			description: "Url for the agenda item",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveUrl,
			type: [AgendaItemUrl],
		}),
	}),
});
