import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { builder } from "~/src/graphql/builder";
import { EventAttendee } from "~/src/graphql/types/EventAttendee/EventAttendee";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryGetEventAttendeesByEventIdArgumentsSchema = z
	.object({
		eventId: z.string().uuid().optional(),
		recurringEventInstanceId: z.string().uuid().optional(),
	})
	.refine(
		(data) =>
			(data.eventId && !data.recurringEventInstanceId) ||
			(!data.eventId && data.recurringEventInstanceId),
		{
			message:
				"Either eventId or recurringEventInstanceId must be provided, but not both",
		},
	);

/**
 * GraphQL query to get all event registrants for a specific event.
 * Handles both standalone events and recurring event instances.
 * Only returns attendees who have registered for the event.
 */
builder.queryField("getEventAttendeesByEventId", (t) =>
	t.field({
		args: {
			eventId: t.arg.id({
				required: false,
				description: "ID of the standalone event",
			}),
			recurringEventInstanceId: t.arg.id({
				required: false,
				description: "ID of the recurring event instance",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Query field to get all event registrants for a specific event.",
		nullable: true,
		resolve: async (_parent, args, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = queryGetEventAttendeesByEventIdArgumentsSchema.safeParse(args);

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
			} else if (parsedArgs.recurringEventInstanceId) {
				const instance =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: eq(
							recurringEventInstancesTable.id,
							parsedArgs.recurringEventInstanceId,
						),
					});

				if (!instance) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["recurringEventInstanceId"],
								},
							],
						},
					});
				}
			}

			// Get all registrants for the event
			const recurringInstanceId = parsedArgs.recurringEventInstanceId;
			const eventAttendees =
				await ctx.drizzleClient.query.eventAttendeesTable.findMany({
					where: parsedArgs.eventId
						? and(
								eq(eventAttendeesTable.eventId, parsedArgs.eventId),
								eq(eventAttendeesTable.isRegistered, true),
							)
						: recurringInstanceId
							? and(
									eq(
										eventAttendeesTable.recurringEventInstanceId,
										recurringInstanceId,
									),
									eq(eventAttendeesTable.isRegistered, true),
								)
							: undefined,
					with: {
						user: true,
					},
				});

			return eventAttendees;
		},
		type: [EventAttendee],
	}),
);
