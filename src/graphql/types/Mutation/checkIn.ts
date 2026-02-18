import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	CheckInCheckOutInput,
	checkInCheckOutInputSchema,
} from "~/src/graphql/inputs/CheckInCheckOutInput";
import { EventAttendee } from "~/src/graphql/types/EventAttendee/EventAttendee";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCheckInArgumentsSchema = z.object({
	data: checkInCheckOutInputSchema,
});

type CheckInArgs = {
	data: {
		userId: string;
		eventId?: string;
		recurringEventInstanceId?: string;
	};
};

/**
 * GraphQL mutation to check in an attendee to an event.
 * Handles both standalone events and recurring event instances.
 */
builder.mutationField("checkIn", (t) =>
	t.field({
		type: EventAttendee,
		args: {
			data: t.arg({
				required: true,
				type: CheckInCheckOutInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to check in an attendee to an event.",
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
			} = mutationCheckInArgumentsSchema.safeParse(args);

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

			// Type assertion after successful validation
			const { data } = parsedArgs as CheckInArgs;

			const currentUserId = ctx.currentClient.user.id;

			// Check if user to be checked in exists
			const userToCheckIn = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, data.userId),
			});

			if (!userToCheckIn) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["data", "userId"],
							},
						],
					},
				});
			}

			// Determine target event and get organization ID
			let organizationId: string;
			let targetEventId: string | null = null;
			let targetRecurringInstanceId: string | null = null;

			if (data.eventId) {
				// Standalone event
				const eventId = data.eventId;
				const event = await ctx.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, eventId),
				});
				if (!event) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["data", "eventId"],
								},
							],
						},
					});
				}

				organizationId = event.organizationId;
				targetEventId = event.id;
			} else if (data.recurringEventInstanceId) {
				// Recurring instance
				const instance =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: eq(
							recurringEventInstancesTable.id,
							data.recurringEventInstanceId,
						),
					});

				if (!instance) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["data", "recurringEventInstanceId"],
								},
							],
						},
					});
				}

				organizationId = instance.organizationId;
				targetRecurringInstanceId = instance.id;
			} else {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["data"],
								message:
									"Either eventId or recurringEventInstanceId must be provided",
							},
						],
					},
				});
			}

			// Check authorization (user must be admin of the organization)
			const currentUserMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					where: and(
						eq(organizationMembershipsTable.memberId, currentUserId),
						eq(organizationMembershipsTable.organizationId, organizationId),
					),
				});

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, currentUserId),
			});

			if (
				currentUser?.role !== "administrator" &&
				currentUserMembership?.role !== "administrator"
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			// Check if attendee already exists
			let attendee =
				await ctx.drizzleClient.query.eventAttendeesTable.findFirst({
					where: and(
						eq(eventAttendeesTable.userId, data.userId),
						targetEventId
							? eq(eventAttendeesTable.eventId, targetEventId)
							: undefined,
						targetRecurringInstanceId
							? eq(
									eventAttendeesTable.recurringEventInstanceId,
									targetRecurringInstanceId,
								)
							: undefined,
					),
				});

			// If attendee doesn't exist, create them
			if (!attendee) {
				const [createdAttendee] = await ctx.drizzleClient
					.insert(eventAttendeesTable)
					.values({
						userId: data.userId,
						eventId: targetEventId,
						recurringEventInstanceId: targetRecurringInstanceId,
						isInvited: false,
						isRegistered: false,
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

				attendee = createdAttendee;
			}

			// Check if already checked in
			if (attendee.isCheckedIn) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["data", "userId"],
								message: "User is already checked in to this event",
							},
						],
					},
				});
			}

			// Update attendee record with check-in time
			const checkInTime = new Date();
			const [updatedAttendee] = await ctx.drizzleClient
				.update(eventAttendeesTable)
				.set({
					checkinTime: checkInTime,
					isCheckedIn: true,
					updatedAt: new Date(),
				})
				.where(eq(eventAttendeesTable.id, attendee.id))
				.returning();

			if (!updatedAttendee) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return updatedAttendee;
		},
	}),
);
