import { and, eq } from "drizzle-orm";
import { volunteerMembershipsTable } from "~/src/drizzle/tables/VolunteerMembership";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { EventVolunteer } from "./EventVolunteer";
import type { EventVolunteer as EventVolunteerType } from "./EventVolunteer";

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
		.select({ status: volunteerMembershipsTable.status })
		.from(volunteerMembershipsTable)
		.where(
			and(
				eq(volunteerMembershipsTable.volunteerId, parent.id),
				eq(volunteerMembershipsTable.eventId, parent.eventId),
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
