import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	EventAttendeeInput,
	eventAttendeeInputSchema,
} from "~/src/graphql/inputs/EventAttendeeInput";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationRemoveEventAttendeeArgumentsSchema = z.object({
	data: eventAttendeeInputSchema,
});

/**
 * GraphQL mutation to remove an event attendee.
 * Handles both standalone events and recurring event instances.
 */
builder.mutationField("removeEventAttendee", (t) =>
	t.field({
		type: User,
		args: {
			data: t.arg({
				required: true,
				type: EventAttendeeInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to remove an event attendee.",
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
			} = mutationRemoveEventAttendeeArgumentsSchema.safeParse(args);

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

			// Check if user to be removed exists
			const userToRemove = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, parsedArgs.data.userId),
			});

			if (!userToRemove) {
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

			if (parsedArgs.data.eventId) {
				// Standalone event
				const event = await ctx.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, parsedArgs.data.eventId),
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
			} else if (parsedArgs.data.recurringEventInstanceId) {
				// Recurring instance
				const instance =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: eq(
							recurringEventInstancesTable.id,
							parsedArgs.data.recurringEventInstanceId,
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

			// Check if user is an attendee
			const existingAttendee =
				await ctx.drizzleClient.query.eventAttendeesTable.findFirst({
					where: and(
						eq(eventAttendeesTable.userId, parsedArgs.data.userId),
						parsedArgs.data.eventId
							? eq(eventAttendeesTable.eventId, parsedArgs.data.eventId)
							: undefined,
						parsedArgs.data.recurringEventInstanceId
							? eq(
									eventAttendeesTable.recurringEventInstanceId,
									parsedArgs.data.recurringEventInstanceId,
								)
							: undefined,
					),
				});

			if (!existingAttendee) {
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

			// Delete the attendee record
			await ctx.drizzleClient
				.delete(eventAttendeesTable)
				.where(eq(eventAttendeesTable.id, existingAttendee.id));

			return userToRemove;
		},
	}),
);
