import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import type { EventWithAttachments } from "~/src/graphql/types/Query/eventQueries";
import { getRecurringEventInstancesByBaseIds } from "~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries";
import { mapRecurringInstanceToEvent } from "~/src/graphql/utils/mapRecurringInstanceToEvent";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const MAX_OFFSET = 10_000;

const queryEventsByCreatorArgumentsSchema = z.object({
	userId: z.string().uuid(),
	limit: z.number().int().min(1).max(100).optional(),
	offset: z.number().int().nonnegative().max(MAX_OFFSET).optional(),
});

/**
 * GraphQL query to get all events created by a specific user.
 * Returns both standalone events and materialized instances from recurring templates.
 * Excludes recurring templates themselves (users attend instances, not templates).
 */
builder.queryField("eventsByCreator", (t) =>
	t.field({
		args: {
			userId: t.arg.id({
				required: true,
				description: "ID of the user whose created events to fetch",
			}),
			limit: t.arg.int({
				description: "Number of events to return (default: 100, max: 100)",
				required: false,
			}),
			offset: t.arg.int({
				description: "Number of events to skip (default: 0, max: 10000)",
				required: false,
			}),
		},
		description: "Query field to fetch all events created by a specific user.",
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
			const parsedArgs = queryEventsByCreatorArgumentsSchema.safeParse(args);
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
			const limit = parsedArgs.data.limit ?? 100;
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

			// Calculate effective window for fetching
			const effectiveWindow = offset + limit;

			try {
				const allEvents: EventWithAttachments[] = [];

				// Step 1: Get standalone events created by user (with windowed limit)
				const standaloneEvents =
					await ctx.drizzleClient.query.eventsTable.findMany({
						where: and(
							eq(eventsTable.creatorId, targetUserId),
							eq(eventsTable.isRecurringEventTemplate, false),
						),
						with: {
							attachmentsWhereEvent: true,
						},
						orderBy: [asc(eventsTable.startAt), asc(eventsTable.id)],
						limit: effectiveWindow,
					});

				// Transform standalone events to unified format
				allEvents.push(
					...standaloneEvents.map((event) => ({
						...event,
						attachments: event.attachmentsWhereEvent,
						eventType: "standalone" as const,
					})),
				);

				// Step 2: Get recurring templates created by user
				const recurringTemplates =
					await ctx.drizzleClient.query.eventsTable.findMany({
						columns: { id: true },
						where: and(
							eq(eventsTable.creatorId, targetUserId),
							eq(eventsTable.isRecurringEventTemplate, true),
						),
					});

				// Step 3: Fetch instances for these templates (with windowed limit)
				const baseRecurringEventIds = recurringTemplates.map((t) => t.id);

				const instances = await getRecurringEventInstancesByBaseIds(
					baseRecurringEventIds,
					ctx.drizzleClient,
					ctx.log,
					{ limit: effectiveWindow, includeCancelled: false },
				);

				// Transform instances to unified format
				const activeInstances = instances.map(mapRecurringInstanceToEvent);

				allEvents.push(...activeInstances);

				// Sort by start time and ID for stable sort
				allEvents.sort((a, b) => {
					const aTime = new Date(a.startAt).getTime();
					const bTime = new Date(b.startAt).getTime();
					if (aTime === bTime) {
						return a.id.localeCompare(b.id);
					}
					return aTime - bTime;
				});

				// Apply final pagination slice
				const paginatedEvents = allEvents.slice(offset, offset + limit);

				ctx.log.debug(
					{
						userId: targetUserId,
						totalEventsFetched: allEvents.length,
						paginatedCount: paginatedEvents.length,
						standaloneFetched: standaloneEvents.length,
						recurringInstancesFetched: activeInstances.length,
						effectiveWindow,
					},
					"Retrieved events by creator",
				);

				return paginatedEvents;
			} catch (error) {
				ctx.log.error(
					{
						userId: targetUserId,
						error,
					},
					"Failed to retrieve events by creator",
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
