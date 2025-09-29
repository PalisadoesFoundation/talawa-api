import { and, eq, ilike, inArray } from "drizzle-orm";

import { eventVolunteersTable } from "~/src/drizzle/tables/EventVolunteer";
import { eventVolunteerExceptionsTable } from "~/src/drizzle/tables/eventVolunteerExceptions";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import type { GraphQLContext } from "~/src/graphql/context";
import { EventVolunteerWhereInput } from "~/src/graphql/inputs/EventVolunteerWhereInput";
import { EventVolunteersOrderByInput } from "~/src/graphql/inputs/EventVolunteersOrderByInput";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { Event } from "./Event";
import type { Event as EventType } from "./Event";

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

	// Template-First Hierarchy: Get volunteers based on new pattern
	let volunteers = await ctx.drizzleClient.query.eventVolunteersTable.findMany({
		where: recurringInstance
			? // For recurring event instances: ALL volunteers come from the base event (templates by default)
				eq(eventVolunteersTable.eventId, baseEventId)
			: // For regular events: Get volunteers directly associated with this event
				eq(eventVolunteersTable.eventId, parent.id),
	});

	const volunteerIds = volunteers.map((volunteer) => volunteer.id);

	// Get exceptions for this specific recurring instance AND check if volunteers have any exceptions at all
	if (volunteerIds.length > 0 && recurringInstance) {
		const [instanceExceptions, allExceptions] = await Promise.all([
			// Exceptions for this specific instance
			ctx.drizzleClient.query.eventVolunteerExceptionsTable.findMany({
				where: and(
					inArray(eventVolunteerExceptionsTable.volunteerId, volunteerIds),
					eq(eventVolunteerExceptionsTable.recurringEventInstanceId, parent.id),
				),
			}),
			// All exceptions for these volunteers (to determine if they're instance-specific)
			ctx.drizzleClient.query.eventVolunteerExceptionsTable.findMany({
				where: inArray(eventVolunteerExceptionsTable.volunteerId, volunteerIds),
				columns: { volunteerId: true },
			}),
		]);

		const instanceExceptionsMap = new Map(
			instanceExceptions.map((exception) => [exception.volunteerId, exception]),
		);

		// Get set of volunteers that have any exceptions (instance-specific)
		const volunteersWithExceptions = new Set(
			allExceptions.map((exception) => exception.volunteerId),
		);

		// Filter volunteers based on exception logic
		volunteers = volunteers.filter((volunteer) => {
			const instanceException = instanceExceptionsMap.get(volunteer.id);
			const hasAnyExceptions = volunteersWithExceptions.has(volunteer.id);

			// If volunteer has exceptions (instance-specific), only include if isException: true for this instance
			if (hasAnyExceptions) {
				if (
					instanceException?.isException === true &&
					!instanceException?.deleted
				) {
					// Apply exception overrides
					volunteer.hasAccepted =
						instanceException.hasAccepted ?? volunteer.hasAccepted;
					volunteer.isPublic = instanceException.isPublic ?? volunteer.isPublic;
					volunteer.hoursVolunteered =
						instanceException.hoursVolunteered ?? volunteer.hoursVolunteered;

					// Mark this volunteer as showing instance-specific exception data
					(volunteer as { isInstanceException?: boolean }).isInstanceException =
						true;
					return true;
				}
				// Instance-specific volunteer without isException: true for this instance
				return false;
			}

			// Template volunteer (no exceptions) - include by default
			(volunteer as { isInstanceException?: boolean }).isInstanceException =
				false;
			return true;
		});
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
