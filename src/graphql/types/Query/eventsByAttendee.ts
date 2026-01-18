import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import {
	type EventWithAttachments,
	getEventsByIds,
} from "~/src/graphql/types/Query/eventQueries";
import { getRecurringEventInstancesByBaseIds } from "~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries";
import { mapRecurringInstanceToEvent } from "~/src/graphql/utils/mapRecurringInstanceToEvent";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryEventsByAttendeeArgumentsSchema = z.object({
	userId: z.string().uuid(),
	limit: z.number().int().min(1).max(100).optional(),
	offset: z.number().int().min(0).optional(),
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
			limit: t.arg.int({
				description: "Number of events to return",
			}),
			offset: t.arg.int({
				description: "Number of events to skip",
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
			const limit = parsedArgs.data.limit ?? 50; // Use 50 as default per instructions
			const offset = parsedArgs.data.offset ?? 0;

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
				// Get all attendee records where user is registered OR checked in OR checked out
				const attendeeRecords =
					await ctx.drizzleClient.query.eventAttendeesTable.findMany({
						columns: {
							eventId: true,
							recurringEventInstanceId: true,
						},
						where: and(
							eq(eventAttendeesTable.userId, targetUserId),
							or(
								eq(eventAttendeesTable.isRegistered, true),
								eq(eventAttendeesTable.isCheckedIn, true),
								eq(eventAttendeesTable.isCheckedOut, true),
							),
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
				const initialEvents = await getEventsByIds(
					uniqueEventIds,
					ctx.drizzleClient,
					ctx.log,
				);

				const events: EventWithAttachments[] = [];
				const recurringTemplateIds: string[] = [];

				// First pass: Collect standalone events and template IDs
				for (const event of initialEvents) {
					if (
						"isRecurringEventTemplate" in event &&
						event.isRecurringEventTemplate
					) {
						recurringTemplateIds.push(event.id);
					} else {
						events.push(event);
					}
				}

				// Batch fetch instances for all templates
				const instances = await getRecurringEventInstancesByBaseIds(
					recurringTemplateIds,
					ctx.drizzleClient,
					ctx.log,
				);

				// Process instances: filter cancelled and deduplicate
				const existingEventIds = new Set(events.map((e) => e.id));

				for (const instance of instances) {
					if (instance.isCancelled) continue;

					// Avoid duplicates if user is also registered for this specific instance
					if (existingEventIds.has(instance.id)) continue;

					events.push(mapRecurringInstanceToEvent(instance));
				}

				// Sort by start time
				events.sort((a, b) => {
					const aTime = new Date(a.startAt).getTime();
					const bTime = new Date(b.startAt).getTime();
					if (aTime === bTime) {
						return a.id.localeCompare(b.id);
					}
					return aTime - bTime;
				});

				const slicedEvents = events.slice(offset, offset + limit);

				ctx.log.debug(
					{
						userId: targetUserId,
						totalEvents: events.length,
						returnedEvents: slicedEvents.length,
						attendeeRecords: attendeeRecords.length,
						limit,
						offset,
					},
					"Retrieved events by attendee",
				);

				return slicedEvents;
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
