import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import { getEventsByIds } from "~/src/graphql/types/Query/eventQueries";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryEventsByAttendeeArgumentsSchema = z.object({
	userId: z.string().uuid(),
});

/**
 * GraphQL query to get all events a user is registered for.
 * Returns events where the user is marked as registered in the event_attendees table.
 * Handles both standalone events and recurring instances.
 */
builder.queryField("eventsByAttendee", (t) =>
	t.field({
		args: {
			userId: t.arg.id({
				required: true,
				description: "ID of the user whose attended events to fetch",
			}),
		},
		description:
			"Query field to fetch all events a user is registered for or has attended.",
		resolve: async (_parent, args, ctx) => {
			// Authentication check
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Validate arguments
			const parsedArgs = queryEventsByAttendeeArgumentsSchema.safeParse(args);
			if (!parsedArgs.success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: parsedArgs.error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;
			const targetUserId = parsedArgs.data.userId;

			// Get current user for authorization
			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: { role: true },
				where: eq(usersTable.id, currentUserId),
			});

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			// Authorization: only own events unless global admin
			if (
				currentUserId !== targetUserId &&
				currentUser.role !== "administrator"
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["userId"] }],
					},
				});
			}

			// Check if target user exists
			const targetUser = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, targetUserId),
			});

			if (!targetUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["userId"] }],
					},
				});
			}

			try {
				// Get all attendee records where user is registered
				const attendeeRecords =
					await ctx.drizzleClient.query.eventAttendeesTable.findMany({
						columns: {
							eventId: true,
							recurringEventInstanceId: true,
						},
						where: and(
							eq(eventAttendeesTable.userId, targetUserId),
							eq(eventAttendeesTable.isRegistered, true),
						),
					});

				if (attendeeRecords.length === 0) {
					return [];
				}

				// Separate standalone event IDs and recurring instance IDs
				const eventIds: string[] = [];
				for (const record of attendeeRecords) {
					// Check recurringEventInstanceId first (takes priority)
					if (record.recurringEventInstanceId) {
						eventIds.push(record.recurringEventInstanceId);
					} else if (record.eventId) {
						eventIds.push(record.eventId);
					}
				}

				// Remove duplicates
				const uniqueEventIds = [...new Set(eventIds)];

				// Use existing utility to fetch events by IDs
				const events = await getEventsByIds(
					uniqueEventIds,
					ctx.drizzleClient,
					ctx.log,
				);

				// Sort by start time
				events.sort((a, b) => {
					const aTime = new Date(a.startAt).getTime();
					const bTime = new Date(b.startAt).getTime();
					if (aTime === bTime) {
						return a.id.localeCompare(b.id);
					}
					return aTime - bTime;
				});

				ctx.log.debug(
					{
						userId: targetUserId,
						totalEvents: events.length,
						attendeeRecords: attendeeRecords.length,
					},
					"Retrieved events by attendee",
				);

				return events;
			} catch (error) {
				ctx.log.error(
					{
						userId: targetUserId,
						error,
					},
					"Failed to retrieve events by attendee",
				);
				throw new TalawaGraphQLError({
					message: "Failed to retrieve events",
					extensions: {
						code: "unexpected",
					},
				});
			}
		},
		type: [Event],
		nullable: false,
	}),
);
