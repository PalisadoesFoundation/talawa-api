import { eq } from "drizzle-orm";
import { z } from "zod";
import { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { eventsTable } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import { AgendaFolder } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryGetAgendaFolderByEventIdArgumentsSchema = z.object({
	eventId: z.string().uuid(),
});

/**
 * GraphQL query to get all agenda folders for a specific event.
 */
builder.queryField("agendaFolderByEventId", (t) =>
	t.field({
		args: {
			eventId: t.arg.id({
				required: true,
				description: "ID of the standalone event",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Query field to get all Agenda Folders for a specific event.",
		nullable: true,
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = queryGetAgendaFolderByEventIdArgumentsSchema.safeParse(args);

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

			// Get all AgendaFolders for the event
			const eventAgendas =
				await ctx.drizzleClient.query.agendaFoldersTable.findMany({
					where: eq(agendaFoldersTable.eventId, parsedArgs.eventId),
				});

			return eventAgendas;
		},
		type: [AgendaFolder],
	}),
);
