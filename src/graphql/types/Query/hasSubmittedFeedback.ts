import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { checkInsTable } from "~/src/drizzle/tables/checkIns";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const queryHasSubmittedFeedbackArgumentsSchema = z
	.object({
		userId: z.string().uuid(),
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
 * GraphQL query to check if a user has submitted feedback for an event.
 * Handles both standalone events and recurring event instances.
 */
builder.queryField("hasSubmittedFeedback", (t) =>
	t.field({
		args: {
			userId: t.arg.id({
				required: true,
				description: "ID of the user",
			}),
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
			"Query field to check if a user has submitted feedback for an event.",
		nullable: true,
		resolve: async (_parent, args, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = queryHasSubmittedFeedbackArgumentsSchema.safeParse(args);

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

			// Check if user exists
			const user = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, parsedArgs.userId),
			});

			if (!user) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["userId"],
							},
						],
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

			// Find the event attendee record
			const recurringInstanceId = parsedArgs.recurringEventInstanceId;
			const eventAttendee =
				await ctx.drizzleClient.query.eventAttendeesTable.findFirst({
					where: and(
						eq(eventAttendeesTable.userId, parsedArgs.userId),
						parsedArgs.eventId
							? eq(eventAttendeesTable.eventId, parsedArgs.eventId)
							: recurringInstanceId
								? eq(
										eventAttendeesTable.recurringEventInstanceId,
										recurringInstanceId,
									)
								: undefined,
					),
				});

			if (!eventAttendee) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["userId"],
							},
						],
					},
				});
			}

			// Check if user has checked in
			if (!eventAttendee.checkInId) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["userId"],
								message: "User has not checked in to this event",
							},
						],
					},
				});
			}

			// Get the check-in record and check feedback status
			const checkIn = await ctx.drizzleClient.query.checkInsTable.findFirst({
				where: eq(checkInsTable.id, eventAttendee.checkInId),
			});

			if (!checkIn) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return checkIn.feedbackSubmitted;
		},
		type: "Boolean",
	}),
);
