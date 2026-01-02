import { eq } from "drizzle-orm";
import { z } from "zod";
import { agendaCategoriesTable } from "~/src/drizzle/tables/agendaCategories";
import { eventsTable } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import { AgendaCategory } from "~/src/graphql/types/AgendaCategories/AgendaCategories";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryGetAgendaCategoryByEventIdArgumentsSchema = z.object({
	eventId: z.string().uuid(),
});

builder.queryField("agendaCategoryByEventId", (t) =>
	t.field({
		args: {
			eventId: t.arg.id({
				required: true,
				description: "ID of the standalone event",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Query field to get all Agenda Categories for a specific event.",
		nullable: true,
		resolve: async (_parent, args, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = queryGetAgendaCategoryByEventIdArgumentsSchema.safeParse(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path.map(String),
							message: issue.message,
						})),
					},
				});
			}

			// Check if event exists
			if (parsedArgs.eventId) {
				const event = await ctx.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, parsedArgs.eventId),
				});

				if (!event) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["eventId"],
								},
							],
						},
					});
				}
			}

			// Get all AgendaCategory for the event
			const eventAgendas =
				await ctx.drizzleClient.query.agendaCategoriesTable.findMany({
					where: eq(agendaCategoriesTable.eventId, parsedArgs.eventId),
				});

			return eventAgendas;
		},
		type: [AgendaCategory],
	}),
);
