import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { builder } from "~/src/graphql/builder";
import { EventAttendee } from "~/src/graphql/types/EventAttendee/EventAttendee";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationRegisterForEventArgumentsSchema = z.object({
	id: z.string().uuid(),
});

/**
 * GraphQL mutation to register current user for an event.
 * Handles both standalone events and recurring event instances.
 */
builder.mutationField("registerForEvent", (t) =>
	t.field({
		type: EventAttendee,
		args: {
			id: t.arg.id({
				required: true,
				description:
					"ID of the event or recurring event instance to register for",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to register current user for an event.",
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
			} = mutationRegisterForEventArgumentsSchema.safeParse(args);

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

			// Try to find as standalone event first
			let isStandaloneEvent = false;
			let isRecurringInstance = false;

			const standaloneEvent =
				await ctx.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, parsedArgs.id),
				});

			if (standaloneEvent) {
				isStandaloneEvent = true;

				// Check if event is registerable
				if (!standaloneEvent.isRegisterable) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["id"],
									message: "Event is not registerable",
								},
							],
						},
					});
				}
			} else {
				// Try as recurring event instance
				const recurringInstance =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: eq(recurringEventInstancesTable.id, parsedArgs.id),
					});

				if (recurringInstance) {
					isRecurringInstance = true;

					// For recurring instances, check exceptions first, then base event
					const baseEvent = await ctx.drizzleClient.query.eventsTable.findFirst(
						{
							where: eq(eventsTable.id, recurringInstance.baseRecurringEventId),
						},
					);

					if (!baseEvent) {
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

					// Check if there's an exception for this specific instance
					const instanceException =
						await ctx.drizzleClient.query.eventExceptionsTable.findFirst({
							where: (fields, { eq }) =>
								eq(fields.recurringEventInstanceId, parsedArgs.id),
						});

					// Use exception data if available, otherwise use base event data
					let effectiveIsRegisterable = baseEvent.isRegisterable;
					if (instanceException?.exceptionData) {
						const exceptionData = instanceException.exceptionData as Record<
							string,
							unknown
						>;
						if (typeof exceptionData.isRegisterable === "boolean") {
							effectiveIsRegisterable = exceptionData.isRegisterable;
						}
					}

					if (!effectiveIsRegisterable) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "invalid_arguments",
								issues: [
									{
										argumentPath: ["id"],
										message: "Event is not registerable",
									},
								],
							},
						});
					}
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

			// Check if user is already registered
			const existingAttendee =
				await ctx.drizzleClient.query.eventAttendeesTable.findFirst({
					where: and(
						eq(eventAttendeesTable.userId, currentUserId),
						isStandaloneEvent
							? eq(eventAttendeesTable.eventId, parsedArgs.id)
							: undefined,
						isRecurringInstance
							? eq(eventAttendeesTable.recurringEventInstanceId, parsedArgs.id)
							: undefined,
					),
				});

			if (existingAttendee) {
				// If already invited, just update to registered
				if (existingAttendee.isInvited && !existingAttendee.isRegistered) {
					const [updatedAttendee] = await ctx.drizzleClient
						.update(eventAttendeesTable)
						.set({
							isRegistered: true,
							updatedAt: new Date(),
						})
						.where(eq(eventAttendeesTable.id, existingAttendee.id))
						.returning();

					if (!updatedAttendee) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
						});
					}

					return updatedAttendee;
				}

				if (existingAttendee.isRegistered) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["id"],
									message: "User is already registered for this event",
								},
							],
						},
					});
				}
			}

			// Create new attendee record
			const [createdAttendee] = await ctx.drizzleClient
				.insert(eventAttendeesTable)
				.values({
					userId: currentUserId,
					eventId: isStandaloneEvent ? parsedArgs.id : null,
					recurringEventInstanceId: isRecurringInstance ? parsedArgs.id : null,
					isInvited: false,
					isRegistered: true,
					isCheckedIn: false,
					isCheckedOut: false,
				})
				.returning();

			if (!createdAttendee) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return createdAttendee;
		},
	}),
);
