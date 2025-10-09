import { eq } from "drizzle-orm";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { CheckOut } from "./CheckOut";
import type { CheckOut as CheckOutType } from "./CheckOut";

export const checkOutCreatedAtResolver = async (
	parent: CheckOutType,
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

	// Get the event attendee to determine organization
	const eventAttendee =
		await ctx.drizzleClient.query.eventAttendeesTable.findFirst({
			where: eq(eventAttendeesTable.id, parent.eventAttendeeId),
		});

	if (eventAttendee === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	// Get the organization ID from the event (either standalone or recurring instance)
	let organizationId: string;
	if (eventAttendee.eventId !== null) {
		const eventId = eventAttendee.eventId;
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
	} else if (eventAttendee.recurringEventInstanceId !== null) {
		const recurringInstanceId = eventAttendee.recurringEventInstanceId;
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

CheckOut.implement({
	fields: (t) => ({
		createdAt: t.field({
			description: "Date time when the check-out record was created.",
			resolve: checkOutCreatedAtResolver,
			type: "DateTime",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			nullable: false,
		}),
	}),
});
