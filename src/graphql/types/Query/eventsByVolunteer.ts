import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import type { EventWithAttachments } from "~/src/graphql/types/Query/eventQueries";
import { getRecurringEventInstancesByBaseId } from "~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries";
import { getEventsByIds } from "~/src/graphql/types/Query/eventQueries/unifiedEventQueries";
import { mapRecurringInstanceToEvent } from "~/src/graphql/utils/mapRecurringInstanceToEvent";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryEventsByVolunteerArgumentsSchema = z.object({
	userId: z.string().uuid(),
	limit: z.number().min(0).max(100).default(100),
	offset: z.number().min(0).default(0),
});

/**
 * GraphQL query to get all events a user is volunteering for.
 * Returns events where the user has accepted volunteer invitation.
 * For template volunteers (isTemplate=true), returns all active instances of the recurring series.
 */
builder.queryField("eventsByVolunteer", (t) =>
	t.field({
		args: {
			userId: t.arg.id({
				required: true,
				description: "ID of the user whose volunteer events to fetch",
			}),
			limit: t.arg.int({
				description:
					"The maximum number of events to return (default: 100, max: 100)",
				required: false,
				defaultValue: 100,
			}),
			offset: t.arg.int({
				description: "The number of events to skip (default: 0)",
				required: false,
				defaultValue: 0,
			}),
		},
		description: "Query field to fetch all events a user is volunteering for.",
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
			const parsedArgs = queryEventsByVolunteerArgumentsSchema.safeParse(args);
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
				// Get all volunteer records where user has accepted
				const volunteerRecords =
					await ctx.drizzleClient.query.eventVolunteersTable.findMany({
						columns: {
							eventId: true,
							recurringEventInstanceId: true,
							isTemplate: true,
						},
						where: and(
							eq(eventVolunteersTable.userId, targetUserId),
							eq(eventVolunteersTable.hasAccepted, true),
						),
					});

				if (volunteerRecords.length === 0) {
					return [];
				}

				const allEvents: EventWithAttachments[] = [];
				const processedEventIds = new Set<string>();

				for (const record of volunteerRecords) {
					// Case 1: Instance-specific volunteer
					if (record.recurringEventInstanceId) {
						if (!processedEventIds.has(record.recurringEventInstanceId)) {
							processedEventIds.add(record.recurringEventInstanceId);
						}
					}
					// Case 2: Template volunteer - get all instances
					else if (record.isTemplate) {
						const instances = await getRecurringEventInstancesByBaseId(
							record.eventId,
							ctx.drizzleClient,
							ctx.log,
						);

						if (instances.length > 0) {
							// Transform active instances to unified format
							const activeInstances = instances
								.filter((instance) => !instance.isCancelled)
								.map(mapRecurringInstanceToEvent);

							allEvents.push(...activeInstances);
							for (const instance of activeInstances) {
								processedEventIds.add(instance.id);
							}
						} else {
							// No instances found (e.g. future event) - fetch the template event directly
							const templateEvent =
								await ctx.drizzleClient.query.eventsTable.findFirst({
									where: eq(eventsTable.id, record.eventId),
									with: {
										attachmentsWhereEvent: true,
									},
								});

							if (templateEvent) {
								const adaptedEvent: EventWithAttachments = {
									...templateEvent,
									attachments: templateEvent.attachmentsWhereEvent || [],
									eventType: "standalone",
								};
								allEvents.push(adaptedEvent);
								processedEventIds.add(record.eventId);
							}
						}
					} else {
						// Case 3: Standalone event volunteer
						// Logic for non-template, non-instance specific volunteers (standalone events)
						const eventId = record.eventId;
						if (eventId && !processedEventIds.has(eventId)) {
							const events = await getEventsByIds(
								[eventId],
								ctx.drizzleClient,
								ctx.log,
							);

							if (events.length > 0) {
								const event = events[0];
								if (event) {
									allEvents.push({
										...event,
										description: event.description ?? null,
										attachments: event.attachments ?? [], // Attachments are preserved if fetched
										eventType: "standalone",
									});
									processedEventIds.add(eventId);
								}
							}
						}
					}
				}

				// Fetch standalone events and instance-specific volunteer events
				const eventIdsToFetch = Array.from(processedEventIds).filter(
					(id) => !allEvents.some((e) => e.id === id),
				);

				if (eventIdsToFetch.length > 0) {
					const fetchedEvents = await getEventsByIds(
						eventIdsToFetch,
						ctx.drizzleClient,
						ctx.log,
					);
					allEvents.push(...fetchedEvents);
				}

				// Sort by start time
				allEvents.sort((a, b) => {
					const aTime = new Date(a.startAt).getTime();
					const bTime = new Date(b.startAt).getTime();
					if (aTime === bTime) {
						return a.id.localeCompare(b.id);
					}
					return aTime - bTime;
				});

				const slicedEvents = allEvents.slice(offset, offset + limit);

				ctx.log.debug(
					{
						userId: targetUserId,
						totalEvents: allEvents.length,
						returnedEvents: slicedEvents.length,
						volunteerRecords: volunteerRecords.length,
						limit,
						offset,
					},
					"Retrieved events by volunteer",
				);

				return slicedEvents;
			} catch (error) {
				ctx.log.error(
					{
						userId: targetUserId,
						error,
					},
					"Failed to retrieve events by volunteer",
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
