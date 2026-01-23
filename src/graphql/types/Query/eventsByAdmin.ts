import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import type { EventWithAttachments } from "~/src/graphql/types/Query/eventQueries";
import { getRecurringEventInstancesByBaseIds } from "~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries";
import { mapRecurringInstanceToEvent } from "~/src/graphql/utils/mapRecurringInstanceToEvent";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const MAX_OFFSET = 10000;

const queryEventsByAdminArgumentsSchema = z.object({
	userId: z.string().uuid(),
	limit: z.number().int().min(1).max(100).optional(),
	offset: z.number().int().min(0).max(MAX_OFFSET).optional(),
});

/**
 * GraphQL query to get all events where a user is an administrator.
 * Returns events from organizations where the user has an 'administrator' role.
 * Includes both standalone events and materialized instances from recurring templates.
 */
builder.queryField("eventsByAdmin", (t) =>
	t.field({
		args: {
			userId: t.arg.id({
				required: true,
				description: "ID of the user whose admin events to fetch",
			}),
			limit: t.arg.int({
				description: "Number of events to return (Max limit: 100)",
			}),
			offset: t.arg.int({
				description: `Number of events to skip (Max offset: ${MAX_OFFSET})`,
			}),
		},
		description:
			"Query field to fetch all events where a user is an administrator (via organization role).",
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
			const parsedArgs = queryEventsByAdminArgumentsSchema.safeParse(args);
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

			try {
				const allEvents: EventWithAttachments[] = [];

				// Step 1: Find organizations where user is an administrator
				const adminMemberships =
					await ctx.drizzleClient.query.organizationMembershipsTable.findMany({
						columns: { organizationId: true },
						where: and(
							eq(organizationMembershipsTable.memberId, targetUserId),
							eq(organizationMembershipsTable.role, "administrator"),
						),
					});

				if (adminMemberships.length === 0) {
					return [];
				}

				const organizationIds = adminMemberships.map((m) => m.organizationId);

				// Calculate effective window for fetching
				const effectiveWindow = limit + offset;

				// Step 2: Get standalone events from these organizations
				const standaloneEvents =
					await ctx.drizzleClient.query.eventsTable.findMany({
						where: and(
							inArray(eventsTable.organizationId, organizationIds),
							eq(eventsTable.isRecurringEventTemplate, false),
						),
						with: {
							attachmentsWhereEvent: true,
						},
						// Deterministic ordering
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

				// Step 3: Get recurring templates from these organizations
				const recurringTemplates =
					await ctx.drizzleClient.query.eventsTable.findMany({
						columns: { id: true },
						where: and(
							inArray(eventsTable.organizationId, organizationIds),
							eq(eventsTable.isRecurringEventTemplate, true),
						),
					});

				// Step 4: For each template, get active instances up to effective window
				const baseRecurringEventIds = recurringTemplates.map((t) => t.id);

				const instances = await getRecurringEventInstancesByBaseIds(
					baseRecurringEventIds,
					ctx.drizzleClient,
					ctx.log,
					{
						limit: effectiveWindow,
						includeCancelled: false,
					},
				);

				// Transform instances to unified format
				const activeInstances = instances.map(mapRecurringInstanceToEvent);

				allEvents.push(...activeInstances);

				// Sort by start time (and ID for ties)
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
						adminOrgCount: organizationIds.length,
						totalEventsBeforeSlice: allEvents.length,
						returnedEvents: slicedEvents.length,
						limit,
						offset,
						effectiveWindow,
					},
					"Retrieved events by admin",
				);

				return slicedEvents;
			} catch (error) {
				ctx.log.error(
					{
						userId: targetUserId,
						error,
					},
					"Failed to retrieve events by admin",
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
