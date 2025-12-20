import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { builder } from "~/src/graphql/builder";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUnregisterForEventByUserArgumentsSchema = z.object({
	id: z.string().uuid(),
});

/**
 * GraphQL mutation to unregister current user from an event.
 * Handles both standalone events and recurring event instances.
 */
builder.mutationField("unregisterForEventByUser", (t) =>
	t.field({
		type: "Boolean",
		args: {
			id: t.arg.id({
				required: true,
				description:
					"ID of the event or recurring event instance to unregister from",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to unregister current user from an event.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = mutationUnregisterForEventByUserArgumentsSchema.safeParse(args);

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

			const currentUserId = ctx.currentClient.user.id;

			// Check if the event exists (standalone or recurring instance)
			let isStandaloneEvent = false;

			const standaloneEvent =
				await ctx.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, parsedArgs.id),
				});

			if (standaloneEvent) {
				isStandaloneEvent = true;
			} else {
				// Try as recurring event instance
				const recurringInstance =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: eq(recurringEventInstancesTable.id, parsedArgs.id),
					});

				if (recurringInstance) {
					// Found recurring instance
				} else {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["id"],
								},
							],
						},
					});
				}
			}

			// Find the attendee record
			const attendee =
				await ctx.drizzleClient.query.eventAttendeesTable.findFirst({
					where: and(
						eq(eventAttendeesTable.userId, currentUserId),
						isStandaloneEvent
							? eq(eventAttendeesTable.eventId, parsedArgs.id)
							: eq(eventAttendeesTable.recurringEventInstanceId, parsedArgs.id),
					),
				});

			if (!attendee) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["id"],
							},
						],
					},
				});
			}

			// Delete the attendee record
			await ctx.drizzleClient
				.delete(eventAttendeesTable)
				.where(eq(eventAttendeesTable.id, attendee.id));

			return true;
		},
	}),
);
