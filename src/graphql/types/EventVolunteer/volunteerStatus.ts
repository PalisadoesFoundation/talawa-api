// check-sanitization-disable: Enum-like status field; no user input involved
import { and, eq } from "drizzle-orm";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { EventVolunteer as EventVolunteerType } from "./EventVolunteer";
import { EventVolunteer } from "./EventVolunteer";

export type VolunteerStatusType = "accepted" | "rejected" | "pending";

export const EventVolunteerStatusResolver = async (
	parent: EventVolunteerType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<VolunteerStatusType> => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}

	// If hasAccepted is true, status is always "accepted"
	if (parent.hasAccepted) {
		return "accepted";
	}

	// Check if any VolunteerMembership for this volunteer has "rejected" status
	const memberships = await ctx.drizzleClient
		.select({ status: eventVolunteerMembershipsTable.status })
		.from(eventVolunteerMembershipsTable)
		.where(
			and(
				eq(eventVolunteerMembershipsTable.volunteerId, parent.id),
				eq(eventVolunteerMembershipsTable.eventId, parent.eventId),
			),
		)
		.execute();

	// If any membership is rejected, overall status is "rejected"
	const hasRejectedMembership = memberships.some(
		(m) => m.status === "rejected",
	);

	return hasRejectedMembership ? "rejected" : "pending";
};

EventVolunteer.implement({
	fields: (t) => ({
		volunteerStatus: t.field({
			description:
				"Computed status of the volunteer: accepted, rejected, or pending based on membership status.",
			type: "String",
			resolve: EventVolunteerStatusResolver,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
