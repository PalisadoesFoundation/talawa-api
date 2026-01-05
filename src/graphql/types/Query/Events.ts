import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { Event } from "~/src/graphql/types/Event/Event";
import { getEventsByIds } from "~/src/graphql/types/Query/eventQueries";
import { filterInviteOnlyEvents } from "~/src/graphql/types/Query/eventQueries/unifiedEventQueries";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryEventsByIdsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1),
});

/**
 * Defines the 'eventsByIds' query field for fetching multiple events by their IDs.
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

				// Batch fetch organization memberships in parallel
				const organizationQueries = Array.from(organizationIds).map((orgId) =>
					ctx.drizzleClient.query.organizationsTable.findFirst({
						columns: { id: true },
						with: {
							membershipsWhereOrganization: {
								columns: { role: true },
								where: (fields, operators) =>
									operators.eq(fields.memberId, currentUserId),
							},
						},
						where: (fields, operators) => operators.eq(fields.id, orgId),
					}),
				);

				const organizations = await Promise.all(organizationQueries);

				// Map results back to organization IDs using the organization's id field
				for (const organization of organizations) {
					if (organization?.id) {
						const membership = organization.membershipsWhereOrganization[0];
						organizationMembershipsMap.set(organization.id, membership);
					}
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
				// Use existing helper that handles all visibility logic including isInvited and isRegistered
				// Pass the organizationMembershipsMap to support cross-org queries
				const filteredEvents = await filterInviteOnlyEvents({
					events: authorizedEvents,
					currentUserId,
					currentUserRole: currentUser.role,
					currentUserOrgMembership: organizationMembershipsMap,
					drizzleClient: ctx.drizzleClient,
				});

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
