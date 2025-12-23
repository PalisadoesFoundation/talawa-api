import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import { getEventsByIds } from "~/src/graphql/types/Query/eventQueries";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryEventsByIdsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

/**
 * @description Defines the 'eventsByIds' query field for fetching multiple events by their IDs.
 * This query supports a mix of standalone events and materialized instances, providing a unified
 * way to retrieve various event types in a single request.
 */
builder.queryField("eventsByIds", (t) =>
	t.field({
		type: [Event],
		args: {
			input: t.arg({
				required: true,
				type: builder.inputType("QueryEventsByIdsInput", {
					fields: (t) => ({
						ids: t.field({
							type: ["ID"],
							required: true,
						}),
					}),
				}),
			}),
		},
		description:
			"Fetches multiple events by their IDs, supporting both standalone events and materialized recurring instances.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const parsedArgs = queryEventsByIdsSchema.safeParse(args.input);
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

			const eventIds = parsedArgs.data.ids;
			const currentUserId = ctx.currentClient.user.id;

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: { role: true },
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			try {
				// Use the unified query to get events by IDs
				const events = await getEventsByIds(
					eventIds,
					ctx.drizzleClient,
					ctx.log,
				);

				// Filter events based on user authorization and organization membership
				// Group events by organization to batch membership checks
				const organizationIds = new Set(
					events.map((event) => event.organizationId),
				);
				const organizationMembershipsMap = new Map<
					string,
					{ role: string } | undefined
				>();

				// Batch fetch organization memberships
				for (const orgId of organizationIds) {
					const organization =
						await ctx.drizzleClient.query.organizationsTable.findFirst({
							columns: { id: true },
							with: {
								membershipsWhereOrganization: {
									columns: { role: true },
									where: (fields, operators) =>
										operators.eq(fields.memberId, currentUserId),
								},
							},
							where: (fields, operators) => operators.eq(fields.id, orgId),
						});

					const membership = organization?.membershipsWhereOrganization[0];
					organizationMembershipsMap.set(orgId, membership);
				}

				// Filter events that user has access to (organization member or global admin)
				const authorizedEvents = events.filter((event) => {
					const membership = organizationMembershipsMap.get(
						event.organizationId,
					);
					return (
						currentUser.role === "administrator" || membership !== undefined
					);
				});

				if (authorizedEvents.length === 0) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "ids"],
								},
							],
						},
					});
				}

				// Filter invite-only events based on visibility rules
				// For events from different organizations, we need to check membership per event
				// Separate public and invite-only events
				const publicEvents = authorizedEvents.filter((e) => !e.isInviteOnly);
				const inviteOnlyEvents = authorizedEvents.filter((e) => e.isInviteOnly);

				if (inviteOnlyEvents.length === 0) {
					return authorizedEvents;
				}

				// Check visibility for each invite-only event
				const visibleInviteOnlyEvents: typeof authorizedEvents = [];

				// Batch check invitations
				const standaloneEventIds: string[] = [];
				const recurringInstanceIds: string[] = [];

				for (const event of inviteOnlyEvents) {
					// Check if user is creator
					if (event.creatorId === currentUserId) {
						visibleInviteOnlyEvents.push(event);
						continue;
					}

					// Check if user is admin (global or org admin for this event's org)
					const eventOrgMembership = organizationMembershipsMap.get(
						event.organizationId,
					);
					if (
						currentUser.role === "administrator" ||
						eventOrgMembership?.role === "administrator"
					) {
						visibleInviteOnlyEvents.push(event);
						continue;
					}

					// Collect for batch invitation check
					if (event.eventType === "standalone") {
						standaloneEventIds.push(event.id);
					} else {
						recurringInstanceIds.push(event.id);
					}
				}

				// Batch check invitations for standalone events
				if (standaloneEventIds.length > 0) {
					const standaloneInvitations =
						await ctx.drizzleClient.query.eventAttendeesTable.findMany({
							columns: {
								eventId: true,
							},
							where: and(
								eq(eventAttendeesTable.userId, currentUserId),
								eq(eventAttendeesTable.isInvited, true),
								inArray(eventAttendeesTable.eventId, standaloneEventIds),
							),
						});

					const invitedEventIds = new Set(
						standaloneInvitations
							.map((inv) => inv.eventId)
							.filter(Boolean) as string[],
					);

					for (const event of inviteOnlyEvents) {
						if (
							event.eventType === "standalone" &&
							invitedEventIds.has(event.id) &&
							!visibleInviteOnlyEvents.some((e) => e.id === event.id)
						) {
							visibleInviteOnlyEvents.push(event);
						}
					}
				}

				// Batch check invitations for recurring instances
				if (recurringInstanceIds.length > 0) {
					const recurringInvitations =
						await ctx.drizzleClient.query.eventAttendeesTable.findMany({
							columns: {
								recurringEventInstanceId: true,
							},
							where: and(
								eq(eventAttendeesTable.userId, currentUserId),
								eq(eventAttendeesTable.isInvited, true),
								inArray(
									eventAttendeesTable.recurringEventInstanceId,
									recurringInstanceIds,
								),
							),
						});

					const invitedInstanceIds = new Set(
						recurringInvitations
							.map((inv) => inv.recurringEventInstanceId)
							.filter(Boolean) as string[],
					);

					for (const event of inviteOnlyEvents) {
						if (
							event.eventType === "generated" &&
							invitedInstanceIds.has(event.id) &&
							!visibleInviteOnlyEvents.some((e) => e.id === event.id)
						) {
							visibleInviteOnlyEvents.push(event);
						}
					}
				}

				const filteredEvents = [...publicEvents, ...visibleInviteOnlyEvents];

				ctx.log.debug(
					{
						requestedIds: eventIds.length,
						foundEvents: filteredEvents.length,
						standaloneEvents: filteredEvents.filter(
							(e) => e.eventType === "standalone",
						).length,
						materializedEvents: filteredEvents.filter(
							(e) => e.eventType === "generated",
						).length,
					},
					"Retrieved events by IDs",
				);

				return filteredEvents;
			} catch (error) {
				ctx.log.error(
					{
						eventIds,
						error,
					},
					"Failed to retrieve events by IDs",
				);
				throw new TalawaGraphQLError({
					message: "Failed to retrieve events",
					extensions: {
						code: "unexpected",
					},
				});
			}
		},
	}),
);
