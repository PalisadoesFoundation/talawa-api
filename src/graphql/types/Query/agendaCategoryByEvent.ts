import { eq } from "drizzle-orm";
import { z } from "zod";
import { agendaCategoriesTable } from "~/src/drizzle/tables/agendaCategories";
import { eventsTable } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";
import { AgendaCategory } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryGetAgendaCategoryByEventIdArgumentsSchema = z.object({
	eventId: z.string().uuid(),
});

builder.queryField("agendaCategoriesByEventId", (t) =>
	t.field({
		args: {
			eventId: t.arg.id({
				required: true,
				description: "ID of the standalone event",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Query field to get all agenda categories for a specific event.",
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

			const currentUserId = ctx.currentClient.user.id;

			const [currentUser, membership] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: { role: true },
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					columns: { role: true },
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.memberId, currentUserId),
							operators.eq(fields.organizationId, event.organizationId),
						),
				}),
			]);

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			if (currentUser.role !== "administrator" && !membership) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["eventId"],
							},
						],
					},
				});
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
