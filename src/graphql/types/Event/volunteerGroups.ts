import { and, eq } from "drizzle-orm";
import { eventVolunteerGroupExceptionsTable } from "~/src/drizzle/tables/eventVolunteerGroupExceptions";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import type { GraphQLContext } from "~/src/graphql/context";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { Event as EventType } from "./Event";
import { Event } from "./Event";

export const EventVolunteerGroupsResolver = async (
	parent: EventType,
	_args: Record<string, never>,
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

	// For recurring instances, get exceptions to filter out excluded template groups
	let groupExceptions: { volunteerGroupId: string }[] = [];
	if (recurringInstance) {
		groupExceptions = await ctx.drizzleClient
			.select({
				volunteerGroupId: eventVolunteerGroupExceptionsTable.volunteerGroupId,
			})
			.from(eventVolunteerGroupExceptionsTable)
			.where(
				eq(
					eventVolunteerGroupExceptionsTable.recurringEventInstanceId,
					parent.id,
				),
			);
	}

	// Template-First Hierarchy: Get volunteer groups based on new pattern
	let volunteerGroups =
		await ctx.drizzleClient.query.eventVolunteerGroupsTable.findMany({
			where: recurringInstance
				? // For recurring event instances: Get template groups + instance-specific groups for this instance
					and(
						eq(eventVolunteerGroupsTable.eventId, baseEventId),
						// Include template groups OR instance-specific groups for this instance
						// Template groups: isTemplate = true
						// Instance-specific groups: isTemplate = false AND recurringEventInstanceId = parent.id
					)
				: // For regular events: Get volunteer groups directly associated with this event
					eq(eventVolunteerGroupsTable.eventId, parent.id),
		});

	// For recurring instances, we need to filter the results based on isTemplate, recurringEventInstanceId, and exceptions
	if (recurringInstance) {
		const exceptionGroupIds = new Set(
			groupExceptions.map((ex) => ex.volunteerGroupId),
		);

		volunteerGroups = volunteerGroups.filter((group) => {
			// Include template groups (apply to all instances) UNLESS they have an exception for this instance
			if (group.isTemplate) {
				if (exceptionGroupIds.has(group.id)) {
					// This template group has been deleted for this instance
					return false;
				}
				(group as { isInstanceException?: boolean }).isInstanceException =
					false;
				return true;
			}

			// Include instance-specific groups for this specific instance
			if (group.recurringEventInstanceId === parent.id) {
				(group as { isInstanceException?: boolean }).isInstanceException = true;
				return true;
			}

			// Exclude instance-specific groups for other instances
			return false;
		});
	} else {
		// For regular events, mark all as not instance exceptions
		for (const group of volunteerGroups) {
			(group as { isInstanceException?: boolean }).isInstanceException = false;
		}
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
