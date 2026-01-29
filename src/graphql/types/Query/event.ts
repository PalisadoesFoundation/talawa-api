import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { builder } from "~/src/graphql/builder";
import {
	QueryEventInput,
	queryEventInputSchema,
} from "~/src/graphql/inputs/QueryEventInput";
import { Event } from "~/src/graphql/types/Event/Event";
import { getEventsByIds } from "~/src/graphql/types/Query/eventQueries";
import { executeWithMetrics } from "~/src/graphql/utils/withQueryMetrics";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryEventArgumentsSchema = z.object({
	input: queryEventInputSchema,
});

/**
 * Defines the 'event' query field for fetching a single event by its ID.
 * This query supports both standalone events and materialized instances of recurring events,
 * ensuring a unified way to retrieve any event type.
 */
builder.queryField("event", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input containing the ID of the event to query.",
				required: true,
				type: QueryEventInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Retrieves a single event by its ID, supporting both standalone events and materialized recurring instances.",
		resolve: async (_parent, args, ctx) => {
			const resolver = async () => {
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
				} = queryEventArgumentsSchema.safeParse(args);

				if (!success) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: error.issues.map((issue) => ({
								argumentPath: issue.path,
								message: issue.message,
							})),
						},
					});
				}

				const currentUserId = ctx.currentClient.user.id;
				const eventId = parsedArgs.input.id;

				// Use the unified getEventsByIds function to fetch the event
				const events = await getEventsByIds(
					[eventId],
					ctx.drizzleClient,
					ctx.log,
				);

				const event = events[0];

				if (!event) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "id"],
								},
							],
						},
					});
				}

				// Perform authorization check
				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				});

				if (!currentUser) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const membership =
					await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.organizationId, event.organizationId),
								operators.eq(fields.memberId, currentUserId),
							),
					});

				// Check if user is an invited or registered attendee before enforcing membership requirement
				const isInvitedOrRegisteredAttendee =
					await ctx.drizzleClient.query.eventAttendeesTable.findFirst({
						where: and(
							eq(eventAttendeesTable.userId, currentUserId),
							or(
								eq(eventAttendeesTable.isInvited, true),
								eq(eventAttendeesTable.isRegistered, true),
							),
							event.eventType === "standalone"
								? eq(eventAttendeesTable.eventId, event.id)
								: eq(eventAttendeesTable.recurringEventInstanceId, event.id),
						),
					});

				if (
					currentUser.role !== "administrator" &&
					!membership &&
					!isInvitedOrRegisteredAttendee
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "id"],
								},
							],
						},
					});
				}

				// Check invite-only visibility
				if (event.isInviteOnly) {
					// Check if user is creator
					const isCreator = event.creatorId === currentUserId;

					// Check if user is admin
					const isAdmin =
						currentUser.role === "administrator" ||
						membership?.role === "administrator";

					// Check if user is invited or registered
					// Registered users (even if not explicitly invited) can also view invite-only events
					let canAccess = false;
					if (!isCreator && !isAdmin) {
						const attendee =
							await ctx.drizzleClient.query.eventAttendeesTable.findFirst({
								where: and(
									eq(eventAttendeesTable.userId, currentUserId),
									or(
										eq(eventAttendeesTable.isInvited, true),
										eq(eventAttendeesTable.isRegistered, true),
									),
									event.eventType === "standalone"
										? eq(eventAttendeesTable.eventId, event.id)
										: eq(
												eventAttendeesTable.recurringEventInstanceId,
												event.id,
											),
								),
							});
						canAccess = attendee !== undefined;
					}

					// If user cannot view invite-only event, return null (not found)
					if (!isCreator && !isAdmin && !canAccess) {
						return null;
					}
				}

				return event;
			};

			return await executeWithMetrics(ctx, "query:event", resolver);
		},
		type: Event,
	}),
);
