import { AgendaCategory } from "~/src/graphql/types/AgendaCategories/AgendaCategories";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AgendaItem } from "./AgendaItem";

AgendaItem.implement({
	fields: (t) => ({
		category: t.field({
			description: "Agenda category",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: async (parent, _args, ctx) => {
				const existingAgendaCatgory =
					await ctx.drizzleClient.query.agendaCategoriesTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parent.categoryId),
					});

				// Parent folder id existing but the associated agenda folder not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingAgendaCatgory === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for an agenda category id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingAgendaCatgory;
			},
			type: AgendaCategory,
		}),
	}),
});
