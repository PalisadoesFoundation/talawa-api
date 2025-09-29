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

	// Get exceptions for this specific recurring instance AND check if groups have any exceptions at all
	if (volunteerGroupIds.length > 0 && recurringInstance) {
		const [instanceExceptions, allExceptions] = await Promise.all([
			// Exceptions for this specific instance
			ctx.drizzleClient.query.eventVolunteerGroupExceptionsTable.findMany({
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
			}),
			// All exceptions for these groups (to determine if they're instance-specific)
			ctx.drizzleClient.query.eventVolunteerGroupExceptionsTable.findMany({
				where: inArray(
					eventVolunteerGroupExceptionsTable.volunteerGroupId,
					volunteerGroupIds,
				),
				columns: { volunteerGroupId: true },
			}),
		]);

		const instanceExceptionsMap = new Map(
			instanceExceptions.map((exception) => [
				exception.volunteerGroupId,
				exception,
			]),
		);

		// Get set of groups that have any exceptions (instance-specific)
		const groupsWithExceptions = new Set(
			allExceptions.map((exception) => exception.volunteerGroupId),
		);

		// Filter volunteer groups based on exception logic
		volunteerGroups = volunteerGroups.filter((group) => {
			const instanceException = instanceExceptionsMap.get(group.id);
			const hasAnyExceptions = groupsWithExceptions.has(group.id);

			// If group has exceptions (instance-specific), only include if isException: true for this instance
			if (hasAnyExceptions) {
				if (
					instanceException?.isException === true &&
					!instanceException?.deleted
				) {
					// Apply exception overrides
					group.name = instanceException.name ?? group.name;
					group.description =
						instanceException.description ?? group.description;
					group.volunteersRequired =
						instanceException.volunteersRequired ?? group.volunteersRequired;
					group.leaderId = instanceException.leaderId ?? group.leaderId;

					// Mark this volunteer group as showing instance-specific exception data
					(group as { isInstanceException?: boolean }).isInstanceException =
						true;
					return true;
				}
				// Instance-specific group without isException: true for this instance
				return false;
			}

			// Template group (no exceptions) - include by default
			(group as { isInstanceException?: boolean }).isInstanceException = false;
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
