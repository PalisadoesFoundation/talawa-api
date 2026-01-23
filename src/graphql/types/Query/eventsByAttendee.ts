import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import {
	type EventWithAttachments,
	getEventsByIds,
} from "~/src/graphql/types/Query/eventQueries";
import { getRecurringEventInstancesByIds } from "~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries";
import { mapRecurringInstanceToEvent } from "~/src/graphql/utils/mapRecurringInstanceToEvent";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryEventsByAttendeeArgumentsSchema = z.object({
	userId: z.string().uuid(),
	limit: z.number().int().nonnegative().max(100).default(100),
	offset: z.number().int().nonnegative().default(0),
});

/**
 * GraphQL query to get all events a user is registered for.
 * Returns events where the user is marked as registered, checked-in, or checked-out in the event_attendees table.
 * Expands event templates and includes recurring instances/instances resolution.
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
			const { limit, offset } = parsedArgs.data;

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
				// Use relations to fetch start times for sorting
				const attendeeRecords =
					await ctx.drizzleClient.query.eventAttendeesTable.findMany({
						where: and(
							eq(eventAttendeesTable.userId, targetUserId),
							or(
								eq(eventAttendeesTable.isRegistered, true),
								eq(eventAttendeesTable.isCheckedIn, true),
								eq(eventAttendeesTable.isCheckedOut, true),
							),
						),
						with: {
							event: {
								columns: {
									startAt: true,
									isRecurringEventTemplate: true,
								},
							},
							recurringEventInstance: {
								columns: {
									actualStartTime: true,
									isCancelled: true,
								},
							},
						},
					});

				if (attendeeRecords.length === 0) {
					return [];
				}

				// Build lightweight list for sorting and pagination
				const allReferenceEvents: {
					id: string;
					startAt: number;
					isRecurringInstance: boolean;
				}[] = [];

				const recurringTemplateIds: string[] = [];

				for (const record of attendeeRecords) {
					if (record.recurringEventInstanceId) {
						if (record.recurringEventInstance) {
							// Skip cancelled instances
							if (record.recurringEventInstance.isCancelled) {
								continue;
							}

							allReferenceEvents.push({
								id: record.recurringEventInstanceId,
								startAt: new Date(
									record.recurringEventInstance.actualStartTime,
								).getTime(),
								isRecurringInstance: true,
							});
						}
						// If instance ID exists but no record, it might be missing data.
						// We do NOT fall through to the event block.
					} else if (record.eventId && record.event) {
						// Check if this "event" is actually a template
						// We need to check isRecurringEventTemplate.
						// Note: We need to ensure we fetched this column in `with`.
						// Since we modify the query above to fetch it, we can check it here.
						const isTemplate = record.event.isRecurringEventTemplate === true;

						if (isTemplate) {
							recurringTemplateIds.push(record.eventId);
						} else {
							allReferenceEvents.push({
								id: record.eventId,
								startAt: new Date(record.event.startAt).getTime(),
								isRecurringInstance: false,
							});
						}
					}
				}

				// If we have templates, fetch their instance references
				if (recurringTemplateIds.length > 0) {
					const templateInstances =
						await ctx.drizzleClient.query.recurringEventInstancesTable.findMany(
							{
								columns: {
									id: true,
									actualStartTime: true,
								},
								where: and(
									inArray(
										recurringEventInstancesTable.baseRecurringEventId,
										recurringTemplateIds,
									),
									eq(recurringEventInstancesTable.isCancelled, false),
								),
							},
						);

					for (const instance of templateInstances) {
						allReferenceEvents.push({
							id: instance.id,
							startAt: new Date(instance.actualStartTime).getTime(),
							isRecurringInstance: true,
						});
					}
				}

				// Remove duplicates (though ID should be unique per record, logic ensures one or the other)
				// Using Map to ensure uniqueness by ID
				const uniqueEventsMap = new Map<
					string,
					{ id: string; startAt: number; isRecurringInstance: boolean }
				>();
				for (const evt of allReferenceEvents) {
					uniqueEventsMap.set(evt.id, evt);
				}
				const uniqueReferenceEvents = Array.from(uniqueEventsMap.values());

				// Sort by start time
				uniqueReferenceEvents.sort((a, b) => {
					if (a.startAt === b.startAt) {
						return a.id.localeCompare(b.id);
					}
					return a.startAt - b.startAt;
				});

				// Apply pagination
				const pagedReferenceEvents = uniqueReferenceEvents.slice(
					offset,
					offset + limit,
				);

				if (pagedReferenceEvents.length === 0) {
					return [];
				}

				// Separate IDs for fetching
				const standaloneEventIds: string[] = [];
				const recurringInstanceIds: string[] = [];

				for (const ref of pagedReferenceEvents) {
					if (ref.isRecurringInstance) {
						recurringInstanceIds.push(ref.id);
					} else {
						standaloneEventIds.push(ref.id);
					}
				}

				// Fetch full data in parallel
				const [standaloneEvents, recurringInstances] = await Promise.all([
					standaloneEventIds.length > 0
						? getEventsByIds(standaloneEventIds, ctx.drizzleClient, ctx.log)
						: Promise.resolve([]),
					recurringInstanceIds.length > 0
						? getRecurringEventInstancesByIds(
								recurringInstanceIds,
								ctx.drizzleClient,
								ctx.log,
							)
						: Promise.resolve([]),
				]);

				// Combine and map
				const eventMap = new Map<string, EventWithAttachments>();

				for (const event of standaloneEvents) {
					eventMap.set(event.id, event);
				}

				for (const instance of recurringInstances) {
					if (!instance.isCancelled) {
						eventMap.set(instance.id, mapRecurringInstanceToEvent(instance));
					}
				}

				// Reorder based on pagedReferenceEvents to maintain sort order
				const resultEvents: EventWithAttachments[] = [];
				for (const ref of pagedReferenceEvents) {
					const event = eventMap.get(ref.id);
					if (event) {
						resultEvents.push(event);
					}
				}

				ctx.log.debug(
					{
						userId: targetUserId,
						totalFound: uniqueReferenceEvents.length,
						returnedEvents: resultEvents.length,
						limit,
						offset,
					},
					"Retrieved events by attendee (optimized)",
				);

				return resultEvents;
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
