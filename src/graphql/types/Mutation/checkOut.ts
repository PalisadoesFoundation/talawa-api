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

const mutationCheckOutArgumentsSchema = z.object({
	data: checkInCheckOutInputSchema,
});

type CheckOutArgs = {
	data: {
		userId: string;
		eventId?: string;
		recurringEventInstanceId?: string;
	};
};

/**
 * GraphQL mutation to check out an attendee from an event.
 * Handles both standalone events and recurring event instances.
 */
builder.mutationField("checkOut", (t) =>
	t.field({
		type: EventAttendee,
		args: {
			data: t.arg({
				required: true,
				type: CheckInCheckOutInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to check out an attendee from an event.",
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
			} = mutationCheckOutArgumentsSchema.safeParse(args);

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
			const { data } = parsedArgs as CheckOutArgs;

			const currentUserId = ctx.currentClient.user.id;

			// Check if user to be checked out exists
			const userToCheckOut = await ctx.drizzleClient.query.usersTable.findFirst(
				{
					where: eq(usersTable.id, data.userId),
				},
			);

			if (!userToCheckOut) {
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

			// Find the attendee record
			const attendee =
				await ctx.drizzleClient.query.eventAttendeesTable.findFirst({
					where: and(
						eq(eventAttendeesTable.userId, data.userId),
						data.eventId
							? eq(eventAttendeesTable.eventId, data.eventId)
							: undefined,
						data.recurringEventInstanceId
							? eq(
									eventAttendeesTable.recurringEventInstanceId,
									data.recurringEventInstanceId,
								)
							: undefined,
					),
				});

			if (!attendee) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["data"],
							},
						],
					},
				});
			}

			// Check if user is checked in
			if (!attendee.isCheckedIn) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["data", "userId"],
								message: "User is not checked in to this event",
							},
						],
					},
				});
			}

			// Check if already checked out
			if (attendee.isCheckedOut) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["data", "userId"],
								message: "User is already checked out from this event",
							},
						],
					},
				});
			}

			// Update attendee record with check-out time
			const checkOutTime = new Date();
			const [updatedAttendee] = await ctx.drizzleClient
				.update(eventAttendeesTable)
				.set({
					checkoutTime: checkOutTime,
					isCheckedOut: true,
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
