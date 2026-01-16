import { AgendaCategory } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AgendaItem } from "./AgendaItem";

AgendaItem.implement({
	fields: (t) => ({
		category: t.field({
			description: "Agenda category",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: async (parent, _args, ctx) => {
				const existingAgendaCategory =
					await ctx.drizzleClient.query.agendaCategoriesTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parent.categoryId),
					});

				if (existingAgendaCategory === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for an agenda category id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingAgendaCategory;
			},
			type: AgendaCategory,
		}),
	}),
});
