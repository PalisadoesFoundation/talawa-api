import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import type { EventWithAttachments } from "~/src/graphql/types/Query/eventQueries";
import { getRecurringEventInstancesByBaseId } from "~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryEventsByAdminArgumentsSchema = z.object({
	userId: z.string().uuid(),
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

				// Step 4: For each template, get all non-cancelled instances
				for (const template of recurringTemplates) {
					const instances = await getRecurringEventInstancesByBaseId(
						template.id,
						ctx.drizzleClient,
						ctx.log,
					);

					// Filter out cancelled instances and transform to unified format
					const activeInstances = instances
						.filter((instance) => !instance.isCancelled)
						.map((instance) => ({
							id: instance.id,
							name: instance.name,
							description: instance.description,
							startAt: instance.actualStartTime,
							endAt: instance.actualEndTime,
							location: instance.location,
							allDay: instance.allDay,
							isPublic: instance.isPublic,
							isRegisterable: instance.isRegisterable,
							isInviteOnly: instance.isInviteOnly,
							organizationId: instance.organizationId,
							creatorId: instance.creatorId,
							updaterId: instance.updaterId,
							createdAt: instance.createdAt,
							updatedAt: instance.updatedAt,
							isRecurringEventTemplate: false,
							baseRecurringEventId: instance.baseRecurringEventId,
							sequenceNumber: instance.sequenceNumber,
							totalCount: instance.totalCount,
							hasExceptions: instance.hasExceptions,
							attachments: [],
							eventType: "generated" as const,
							isGenerated: true,
						}));

					allEvents.push(...activeInstances);
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

				ctx.log.debug(
					{
						userId: targetUserId,
						adminOrgCount: organizationIds.length,
						totalEvents: allEvents.length,
					},
					"Retrieved events by admin",
				);

				return allEvents;
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
