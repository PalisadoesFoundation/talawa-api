import { and, eq } from "drizzle-orm";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { EventVolunteerGroup as EventVolunteerGroupType } from "./EventVolunteerGroup";
import { EventVolunteerGroup } from "./EventVolunteerGroup";

export const EventVolunteerGroupVolunteersResolver = async (
	parent: EventVolunteerGroupType,
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

	// Get volunteers who have ACCEPTED invitations to this group
	// This matches the old API behavior where volunteers array only includes accepted volunteers
	const acceptedVolunteers = await ctx.drizzleClient
		.select({
			volunteer: eventVolunteersTable,
		})
		.from(eventVolunteersTable)
		.innerJoin(
			eventVolunteerMembershipsTable,
			eq(eventVolunteerMembershipsTable.volunteerId, eventVolunteersTable.id),
		)
		.where(
			and(
				eq(eventVolunteerMembershipsTable.groupId, parent.id),
				eq(eventVolunteerMembershipsTable.status, "accepted"), // Only accepted volunteers
				eq(eventVolunteersTable.hasAccepted, true), // Double check volunteer acceptance
			),
		)
		.execute();

	return acceptedVolunteers.map((result) => result.volunteer);
};

EventVolunteerGroup.implement({
	fields: (t) => ({
		volunteers: t.field({
			description:
				"List of volunteers who have accepted invitations to this group.",
			resolve: EventVolunteerGroupVolunteersResolver,
			type: [EventVolunteer],
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
