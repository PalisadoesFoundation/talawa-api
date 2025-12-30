import { and, asc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { EventVolunteerGroupOrderByInput } from "~/src/graphql/enums/EventVolunteerGroupOrderByInput";
import {
	EventVolunteerGroupWhereInput,
	eventVolunteerGroupWhereInputSchema,
} from "~/src/graphql/inputs/EventVolunteerGroupWhereInput";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryGetEventVolunteerGroupsArgumentsSchema = z.object({
	where: eventVolunteerGroupWhereInputSchema,
	orderBy: z
		.enum([
			"volunteers_ASC",
			"volunteers_DESC",
			"assignments_ASC",
			"assignments_DESC",
		])
		.nullable()
		.optional(),
});

/**
 * GraphQL query to get event volunteer groups.
 * Based on the old Talawa API getEventVolunteerGroups query.
 */
builder.queryField("getEventVolunteerGroups", (t) =>
	t.field({
		type: [EventVolunteerGroup],
		args: {
			where: t.arg({
				required: true,
				type: EventVolunteerGroupWhereInput,
				description: "Filter criteria for event volunteer groups.",
			}),
			orderBy: t.arg({
				required: false,
				type: EventVolunteerGroupOrderByInput,
				description: "Order criteria for event volunteer groups.",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Query field to get event volunteer groups.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = queryGetEventVolunteerGroupsArgumentsSchema.safeParse(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path.map(String),
							message: issue.message,
						})),
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			if (parsedArgs.where.userId && parsedArgs.where.orgId) {
				// SECURITY FIX: User path - only show groups to accepted volunteers
				// Find groups where user has accepted volunteer memberships
				const userGroups = await ctx.drizzleClient
					.select({
						group: eventVolunteerGroupsTable,
					})
					.from(eventVolunteerGroupsTable)
					.innerJoin(
						eventVolunteerMembershipsTable,
						eq(
							eventVolunteerMembershipsTable.groupId,
							eventVolunteerGroupsTable.id,
						),
					)
					.innerJoin(
						eventVolunteersTable,
						eq(
							eventVolunteerMembershipsTable.volunteerId,
							eventVolunteersTable.id,
						),
					)
					.innerJoin(
						eventsTable,
						eq(eventVolunteerGroupsTable.eventId, eventsTable.id),
					)
					.where(
						and(
							eq(eventVolunteersTable.userId, parsedArgs.where.userId),
							eq(eventVolunteersTable.hasAccepted, true), // SECURITY: Only accepted volunteers
							eq(eventVolunteerMembershipsTable.status, "accepted"), // SECURITY: Only accepted group memberships
							eq(eventsTable.organizationId, parsedArgs.where.orgId),
						),
					)
					.execute();

				return userGroups.map((result) => result.group);
			}

			// Build where conditions for admin path
			const whereConditions = [];

			if (parsedArgs.where.eventId) {
				// Check if this is a recurring event instance
				const instance =
					await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
						where: eq(
							recurringEventInstancesTable.id,
							parsedArgs.where.eventId,
						),
					});

				if (instance) {
					// For recurring instances, show both instance-specific groups and template groups
					whereConditions.push(
						or(
							eq(eventVolunteerGroupsTable.eventId, parsedArgs.where.eventId), // Instance-specific groups
							and(
								eq(
									eventVolunteerGroupsTable.eventId,
									instance.baseRecurringEventId,
								), // Template groups
								eq(eventVolunteerGroupsTable.isTemplate, true),
							),
						),
					);
				} else {
					// For regular events or templates, use direct eventId matching
					whereConditions.push(
						eq(eventVolunteerGroupsTable.eventId, parsedArgs.where.eventId),
					);
				}
			}

			// If eventId is provided, check authorization for that event
			if (parsedArgs.where.eventId) {
				const event = await ctx.drizzleClient.query.eventsTable.findFirst({
					where: eq(eventsTable.id, parsedArgs.where.eventId),
				});

				if (!event) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["where", "eventId"],
								},
							],
						},
					});
				}

				// Check if current user is authorized to view groups for this event
				const currentUserMembership =
					await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
						where: and(
							eq(organizationMembershipsTable.memberId, currentUserId),
							eq(
								organizationMembershipsTable.organizationId,
								event.organizationId,
							),
						),
					});

				const isOrgAdmin = currentUserMembership?.role === "administrator";
				const isEventCreator = event.creatorId === currentUserId;

				if (!isOrgAdmin && !isEventCreator) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}
			}

			// Handle name filtering and leader name filtering with joins
			if (parsedArgs.where.name_contains || parsedArgs.where.leaderName) {
				const groupsWithFiltering = await ctx.drizzleClient
					.select({
						group: eventVolunteerGroupsTable,
					})
					.from(eventVolunteerGroupsTable)
					.leftJoin(
						usersTable,
						eq(eventVolunteerGroupsTable.leaderId, usersTable.id),
					)
					.where(
						and(
							...whereConditions,
							// Add name filtering if specified
							parsedArgs.where.name_contains
								? ilike(
										eventVolunteerGroupsTable.name,
										`%${parsedArgs.where.name_contains}%`,
									)
								: undefined,
							// Add leader name filtering if specified
							parsedArgs.where.leaderName
								? ilike(usersTable.name, `%${parsedArgs.where.leaderName}%`)
								: undefined,
						),
					)
					.orderBy(asc(eventVolunteerGroupsTable.createdAt)) // Default ordering for now
					.execute();

				return groupsWithFiltering.map((result) => result.group);
			}

			// Simple query without name filtering
			const groups = await ctx.drizzleClient
				.select()
				.from(eventVolunteerGroupsTable)
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
				.orderBy(asc(eventVolunteerGroupsTable.createdAt)) // Default ordering for now
				.execute();

			return groups;
		},
	}),
);
