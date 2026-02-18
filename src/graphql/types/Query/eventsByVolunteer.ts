import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import { getEventsByIds } from "~/src/graphql/types/Query/eventQueries/unifiedEventQueries";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const MAX_OFFSET = 10_000;

const queryEventsByVolunteerArgumentsSchema = z.object({
	userId: z.string().uuid(),
	limit: z.number().int().nonnegative().max(100).default(100),
	offset: z.number().int().nonnegative().max(MAX_OFFSET).default(0),
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
				description: `The number of events to skip (default: 0, max: ${MAX_OFFSET})`,
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
				columns: { id: true },
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

				const templateIds: string[] = [];
				const possiblyStandaloneEventIds: string[] = [];
				const specificInstanceIds: string[] = [];

				// Precedence: recurringEventInstanceId takes priority—records with both set
				// are treated as instance-specific volunteers.
				for (const record of volunteerRecords) {
					if (record.recurringEventInstanceId) {
						specificInstanceIds.push(record.recurringEventInstanceId);
						continue;
					}
					if (record.isTemplate && record.eventId) {
						// Might be a recurring template OR a standalone event (default scope)
						templateIds.push(record.eventId);
						continue;
					}
					if (record.eventId) {
						possiblyStandaloneEventIds.push(record.eventId);
					}
				}

				// Check "potential" template IDs and standalone IDs against eventsTable
				// to determine if they are truly recurring templates or standalone events.
				const baseEventIdsToCheck = [
					...new Set([...templateIds, ...possiblyStandaloneEventIds]),
				];

				let baseEventsInfo: {
					id: string;
					startAt: Date;
					isRecurringEventTemplate: boolean;
				}[] = [];

				if (baseEventIdsToCheck.length > 0) {
					baseEventsInfo = await ctx.drizzleClient.query.eventsTable.findMany({
						columns: {
							id: true,
							startAt: true,
							isRecurringEventTemplate: true,
						},
						where: inArray(eventsTable.id, baseEventIdsToCheck),
					});
				}

				const realTemplateIds: string[] = [];

				// Helper to store lightweight event info for sorting
				type EventReference = {
					id: string;
					startTime: number;
					// tiebreaker for stable sort
					secondaryId: string;
				};
				const eventReferences: EventReference[] = [];

				// Process Base Events lookup
				for (const info of baseEventsInfo) {
					if (info.isRecurringEventTemplate) {
						// It is a real recurring template.
						// Only treat as template source if the volunteer record was for a template.
						// (If it was a standalone volunteer record pointing to a template event... likely invalid or edge case, ignore for now or treat as event?)
						// Assuming volunteer via templateIds means we want instances.
						if (templateIds.includes(info.id)) {
							realTemplateIds.push(info.id);
						} else {
							// Volunteer record thinks it's standalone/instance-specific but no instance ID?
							// Treat as single event occurrence?
							eventReferences.push({
								id: info.id,
								startTime: new Date(info.startAt).getTime(),
								secondaryId: info.id,
							});
						}
					} else {
						// It is a Standalone Event (or just not a template).
						// Treat as an individual event outcome.
						eventReferences.push({
							id: info.id,
							startTime: new Date(info.startAt).getTime(),
							secondaryId: info.id,
						});
					}
				}

				// 2. Fetch info for Specific Instances (from volunteer records with instance ID)
				if (specificInstanceIds.length > 0) {
					const instances =
						await ctx.drizzleClient.query.recurringEventInstancesTable.findMany(
							{
								columns: { id: true, actualStartTime: true },
								where: and(
									inArray(recurringEventInstancesTable.id, specificInstanceIds),
									eq(recurringEventInstancesTable.isCancelled, false),
								),
							},
						);
					for (const i of instances) {
						eventReferences.push({
							id: i.id,
							startTime: new Date(i.actualStartTime).getTime(),
							secondaryId: i.id,
						});
					}
				}

				// 3. Fetch info for Template Instances (Batched)
				// We need to fetch enough instances to cover the offset+limit window.
				const foundBaseIds = new Set<string>();

				if (realTemplateIds.length > 0) {
					const instances =
						await ctx.drizzleClient.query.recurringEventInstancesTable.findMany(
							{
								columns: {
									id: true,
									actualStartTime: true,
									baseRecurringEventId: true,
								},
								where: and(
									inArray(
										recurringEventInstancesTable.baseRecurringEventId,
										realTemplateIds,
									),
									eq(recurringEventInstancesTable.isCancelled, false),
								),
								orderBy: [
									asc(recurringEventInstancesTable.actualStartTime),
									asc(recurringEventInstancesTable.id),
								],
								// We fetch up to offset + limit. Even if all standalone events are later,
								// we have enough instances to fill the page.
								limit: offset + limit,
							},
						);

					for (const i of instances) {
						if (i.baseRecurringEventId) {
							foundBaseIds.add(i.baseRecurringEventId);
						}
						eventReferences.push({
							id: i.id,
							startTime: new Date(i.actualStartTime).getTime(),
							secondaryId: i.id,
						});
					}
				}

				// Fallback: If a template has NO active instances (even across all pages),
				// and it was requested as a template volunteer, we return the Base Event itself.
				// This ensures users see the event they volunteered for if no instances are generated yet.
				// Seed templatesWithInstances from foundBaseIds already populated from the windowed fetch.
				const templatesWithInstances = new Set<string>(foundBaseIds);

				// Only query for remaining templates that weren't found in the windowed fetch
				const remainingTemplateIds = realTemplateIds.filter(
					(id) => !foundBaseIds.has(id),
				);

				if (remainingTemplateIds.length > 0) {
					// Check for existence of ANY non-cancelled instances for remaining templates
					const activeInstances =
						await ctx.drizzleClient.query.recurringEventInstancesTable.findMany(
							{
								columns: { baseRecurringEventId: true },
								where: and(
									inArray(
										recurringEventInstancesTable.baseRecurringEventId,
										remainingTemplateIds,
									),
									eq(recurringEventInstancesTable.isCancelled, false),
								),
							},
						);
					for (const i of activeInstances) {
						if (i.baseRecurringEventId) {
							templatesWithInstances.add(i.baseRecurringEventId);
						}
					}
				}

				for (const templateId of realTemplateIds) {
					// Only fallback if NO active instances exist for this template at all
					if (!templatesWithInstances.has(templateId)) {
						// Retrieve info from baseEventsInfo
						const info = baseEventsInfo.find((e) => e.id === templateId);
						if (info) {
							eventReferences.push({
								id: info.id,
								startTime: new Date(info.startAt).getTime(),
								secondaryId: info.id,
							});
						}
					}
				}

				// Deduplicate references
				const uniqueReferencesMap = new Map<string, EventReference>();
				for (const ref of eventReferences) {
					uniqueReferencesMap.set(ref.id, ref);
				}
				const uniqueReferences = Array.from(uniqueReferencesMap.values());

				// Sort
				uniqueReferences.sort((a, b) => {
					if (a.startTime === b.startTime) {
						return a.secondaryId.localeCompare(b.secondaryId);
					}
					return a.startTime - b.startTime;
				});

				// Slice
				const pagedReferences = uniqueReferences.slice(offset, offset + limit);

				if (pagedReferences.length === 0) {
					return [];
				}

				// Fetch full event objects
				const idsToFetch = pagedReferences.map((r) => r.id);
				const events = await getEventsByIds(
					idsToFetch,
					ctx.drizzleClient,
					ctx.log,
				);

				// Re-sort the fetched events to match the pagedReferences order
				// (getEventsByIds does not guarantee order)
				const eventsMap = new Map(events.map((e) => [e.id, e]));
				const orderedEvents = idsToFetch
					.map((id) => eventsMap.get(id))
					.filter((e) => e !== undefined); // specific filter

				ctx.log.debug(
					{
						userId: targetUserId,
						totalFound: uniqueReferences.length,
						returnedCount: orderedEvents.length,
						limit,
						offset,
					},
					"Retrieved events by volunteer",
				);

				return orderedEvents;
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
