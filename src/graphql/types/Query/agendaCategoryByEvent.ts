import { eq } from "drizzle-orm";
import { z } from "zod";
import { agendaCategoriesTable } from "~/src/drizzle/tables/agendaCategories";
import { eventsTable } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import { AgendaCategory } from "~/src/graphql/types/AgendaCategories/AgendaCategories";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const queryGetAgendaItemByEventIdArgumentsSchema = z
    .object({
        eventId: z.string().uuid(),
    })

/**
 * GraphQL query to get all event registrants for a specific event.
 * Handles both standalone events and recurring event instances.
 * Only returns attendees who have registered for the event.
 */
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
            } = queryGetAgendaItemByEventIdArgumentsSchema.safeParse(args);

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

            // Get all AgendaItems for the event
            const eventAgendas =
                await ctx.drizzleClient.query.agendaCategoriesTable.findMany({
                    where: eq(agendaCategoriesTable.eventId, parsedArgs.eventId!),
                });

            return eventAgendas;
        },
        type: [AgendaCategory],
    }),
);
