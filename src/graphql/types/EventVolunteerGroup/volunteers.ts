import { and, eq } from "drizzle-orm";
import { eventVolunteersTable } from "~/src/drizzle/tables/EventVolunteer";
import { volunteerMembershipsTable } from "~/src/drizzle/tables/EventVolunteerMembership";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { EventVolunteerGroup } from "./EventVolunteerGroup";
import type { EventVolunteerGroup as EventVolunteerGroupType } from "./EventVolunteerGroup";

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
			volunteerMembershipsTable,
			eq(volunteerMembershipsTable.volunteerId, eventVolunteersTable.id),
		)
		.where(
			and(
				eq(volunteerMembershipsTable.groupId, parent.id),
				eq(volunteerMembershipsTable.status, "accepted"), // Only accepted volunteers
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
