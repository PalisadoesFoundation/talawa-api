import type { GraphQLContext } from "~/src/graphql/context";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	EventAttendee,
	type EventAttendee as EventAttendeeType,
} from "./EventAttendee";

export const eventAttendeeCreatedAtResolver = async (
	parent: EventAttendeeType,
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

	// Get the organization ID from the event (either standalone or recurring instance)
	let organizationId: string;
	if (parent.eventId !== null) {
		const eventId = parent.eventId;
		const event = await ctx.drizzleClient.query.eventsTable.findFirst({
			columns: { organizationId: true },
			where: (fields, operators) => operators.eq(fields.id, eventId),
		});
		if (!event) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			});
		}
		organizationId = event.organizationId;
	} else if (parent.recurringEventInstanceId !== null) {
		const recurringInstanceId = parent.recurringEventInstanceId;
		const instance =
			await ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
				columns: { organizationId: true },
				where: (fields, operators) =>
					operators.eq(fields.id, recurringInstanceId),
			});
		if (!instance) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			});
		}
		organizationId = instance.organizationId;
	} else {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

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
					operators.eq(fields.organizationId, organizationId),
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

	if (
		currentUser.role !== "administrator" &&
		(currentUserOrganizationMembership === undefined ||
			currentUserOrganizationMembership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	return parent.createdAt;
};

EventAttendee.implement({
	fields: (t) => ({
		createdAt: t.field({
			description: "Date time when the event attendee record was created.",
			resolve: eventAttendeeCreatedAtResolver,
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			type: "DateTime",
			nullable: false,
		}),
	}),
});
