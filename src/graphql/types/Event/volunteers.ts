import { and, eq, ilike, inArray } from "drizzle-orm";

import { eventVolunteerExceptionsTable } from "~/src/drizzle/tables/eventVolunteerExceptions";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import type { GraphQLContext } from "~/src/graphql/context";
import { EventVolunteersOrderByInput } from "~/src/graphql/inputs/EventVolunteersOrderByInput";
import { EventVolunteerWhereInput } from "~/src/graphql/inputs/EventVolunteerWhereInput";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { Event as EventType } from "./Event";
import { Event } from "./Event";

type EventVolunteersArgs = {
	where?: {
		id?: string | null;
		eventId?: string | null;
		groupId?: string | null;
		hasAccepted?: boolean | null;
		name_contains?: string | null;
	} | null;
	orderBy?: "hoursVolunteered_ASC" | "hoursVolunteered_DESC" | null;
};

export const EventVolunteersResolver = async (
	parent: EventType,
	args: EventVolunteersArgs,
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

	// Get current user with organization membership info
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

	// Check if user is authorized to view volunteers
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
		: "baseRecurringEventId" in parent && parent.baseRecurringEventId
			? parent.baseRecurringEventId
			: parent.id;

	// For recurring instances, get exceptions to filter out excluded template volunteers
	let exceptions: { volunteerId: string }[] = [];
	if (recurringInstance) {
		exceptions = await ctx.drizzleClient
			.select({
				volunteerId: eventVolunteerExceptionsTable.volunteerId,
			})
			.from(eventVolunteerExceptionsTable)
			.where(
				eq(eventVolunteerExceptionsTable.recurringEventInstanceId, parent.id),
			);
	}

	// Template-First Hierarchy: Get volunteers based on new pattern
	let volunteers = await ctx.drizzleClient.query.eventVolunteersTable.findMany({
		where: recurringInstance
			? // For recurring event instances: Get template volunteers + instance-specific volunteers for this instance
				and(
					eq(eventVolunteersTable.eventId, baseEventId),
					// Include template volunteers OR instance-specific volunteers for this instance
					// Template volunteers: isTemplate = true
					// Instance-specific volunteers: isTemplate = false AND recurringEventInstanceId = parent.id
				)
			: // For regular events: Get all volunteers directly associated with this event
				eq(eventVolunteersTable.eventId, parent.id),
	});

	// For recurring instances, we need to filter the results based on isTemplate, recurringEventInstanceId, and exceptions
	if (recurringInstance) {
		const excludedVolunteerIds = new Set(
			exceptions.map((ex) => ex.volunteerId),
		);

		volunteers = volunteers.filter((volunteer) => {
			// Include template volunteers (apply to all instances) UNLESS they have an exclusion exception for this instance
			if (volunteer.isTemplate) {
				if (excludedVolunteerIds.has(volunteer.id)) {
					// This template volunteer has been excluded for this instance
					return false;
				}
				(volunteer as { isInstanceException?: boolean }).isInstanceException =
					false;
				return true;
			}

			// Include instance-specific volunteers for this specific instance
			if (volunteer.recurringEventInstanceId === parent.id) {
				(volunteer as { isInstanceException?: boolean }).isInstanceException =
					true;
				return true;
			}

			// Exclude instance-specific volunteers for other instances
			return false;
		});
	} else {
		// For regular events, mark all as not instance exceptions
		for (const volunteer of volunteers) {
			(volunteer as { isInstanceException?: boolean }).isInstanceException =
				false;
		}
	}

	// Apply filters from where input
	if (args.where) {
		const { where } = args;

		if (where.hasAccepted !== undefined && where.hasAccepted !== null) {
			volunteers = volunteers.filter(
				(v) => v.hasAccepted === where.hasAccepted,
			);
		}

		if (where.name_contains) {
			// Need to join with users to filter by name
			const volunteerIds = volunteers.map((v) => v.id);
			if (volunteerIds.length > 0) {
				const volunteersWithUsers = await ctx.drizzleClient
					.select({
						volunteer: eventVolunteersTable,
						user: usersTable,
					})
					.from(eventVolunteersTable)
					.leftJoin(usersTable, eq(eventVolunteersTable.userId, usersTable.id))
					.where(
						and(
							inArray(eventVolunteersTable.id, volunteerIds),
							ilike(usersTable.name, `%${where.name_contains}%`),
						),
					);

				const filteredVolunteerIds = volunteersWithUsers.map(
					(result) => result.volunteer.id,
				);
				volunteers = volunteers.filter((v) =>
					filteredVolunteerIds.includes(v.id),
				);
			}
		}
	}

	// Apply sorting
	if (args.orderBy === "hoursVolunteered_ASC") {
		volunteers.sort(
			(a, b) =>
				Number.parseFloat(a.hoursVolunteered) -
				Number.parseFloat(b.hoursVolunteered),
		);
	} else if (args.orderBy === "hoursVolunteered_DESC") {
		volunteers.sort(
			(a, b) =>
				Number.parseFloat(b.hoursVolunteered) -
				Number.parseFloat(a.hoursVolunteered),
		);
	}

	return volunteers;
};

Event.implement({
	fields: (t) => ({
		volunteers: t.field({
			description: "List of all volunteers associated with this event.",
			type: t.listRef(EventVolunteer),
			args: {
				where: t.arg({
					required: false,
					type: EventVolunteerWhereInput,
					description: "Filter criteria for event volunteers.",
				}),
				orderBy: t.arg({
					required: false,
					type: EventVolunteersOrderByInput,
					description: "Order criteria for event volunteers.",
				}),
			},
			resolve: EventVolunteersResolver,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
