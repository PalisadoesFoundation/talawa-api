import { and, eq, inArray } from "drizzle-orm";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/EventVolunteerGroup";
import { eventVolunteerGroupExceptionsTable } from "~/src/drizzle/tables/eventVolunteerGroupExceptions";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import type { GraphQLContext } from "~/src/graphql/context";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { Event } from "./Event";
import type { Event as EventType } from "./Event";

export const EventVolunteerGroupsResolver = async (
	parent: EventType,
	args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	// Check authorization similar to volunteers resolver
	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		columns: {
			role: true,
		},
		with: {
			organizationMembershipsWhereMember: {
				columns: {
					role: true,
				},
				where: (fields, operators) =>
					operators.eq(fields.organizationId, parent.organizationId),
			},
		},
		where: (fields, operators) => operators.eq(fields.id, currentUserId),
	});

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];

	// Check if user is authorized to view volunteer groups
	if (
		currentUser.role !== "administrator" &&
		(currentUserOrganizationMembership === undefined ||
			(currentUserOrganizationMembership.role !== "administrator" &&
				currentUserOrganizationMembership.role !== "regular"))
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	// Check if parent.id is a recurring event instance
	const recurringInstance =
		await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
			where: eq(recurringEventInstancesTable.id, parent.id),
		});

	// Determine base event ID for recurring events
	const baseEventId = recurringInstance
		? recurringInstance.baseRecurringEventId
		: parent.id;

	// Template-First Hierarchy: Get volunteer groups based on new pattern
	let volunteerGroups =
		await ctx.drizzleClient.query.eventVolunteerGroupsTable.findMany({
			where: recurringInstance
				? // For recurring event instances: ALL volunteer groups come from the base event (templates by default)
					eq(eventVolunteerGroupsTable.eventId, baseEventId)
				: // For regular events: Get volunteer groups directly associated with this event
					eq(eventVolunteerGroupsTable.eventId, parent.id),
		});

	const volunteerGroupIds = volunteerGroups.map((group) => group.id);

	// Get exceptions for this specific recurring instance
	if (volunteerGroupIds.length > 0 && recurringInstance) {
		const exceptions =
			await ctx.drizzleClient.query.eventVolunteerGroupExceptionsTable.findMany(
				{
					where: and(
						inArray(
							eventVolunteerGroupExceptionsTable.volunteerGroupId,
							volunteerGroupIds,
						),
						eq(
							eventVolunteerGroupExceptionsTable.recurringEventInstanceId,
							parent.id,
						),
					),
				},
			);

		const exceptionsMap = new Map(
			exceptions.map((exception) => [exception.volunteerGroupId, exception]),
		);

		// Filter out non-participating volunteer groups and apply exceptions
		volunteerGroups = volunteerGroups.filter((group) => {
			const exception = exceptionsMap.get(group.id);

			// If the volunteer group is marked as not participating for this instance, exclude it
			if (exception?.participating === false || exception?.deleted === true) {
				return false;
			}

			// Apply exception overrides if they exist
			if (exception) {
				group.name = exception.name ?? group.name;
				group.description = exception.description ?? group.description;
				group.volunteersRequired =
					exception.volunteersRequired ?? group.volunteersRequired;
				group.leaderId = exception.leaderId ?? group.leaderId;

				// Mark this volunteer group as showing instance-specific exception data
				(group as { isInstanceException?: boolean }).isInstanceException = true;
			} else {
				(group as { isInstanceException?: boolean }).isInstanceException =
					false;
			}

			return true;
		});
	}

	return volunteerGroups;
};

Event.implement({
	fields: (t) => ({
		volunteerGroups: t.field({
			description: "List of volunteer groups associated with this event.",
			type: t.listRef(EventVolunteerGroup),
			resolve: EventVolunteerGroupsResolver,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
