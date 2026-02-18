import { and, eq } from "drizzle-orm";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { EventVolunteer as EventVolunteerType } from "./EventVolunteer";
import { EventVolunteer } from "./EventVolunteer";

export const EventVolunteerGroupsResolver = async (
	parent: EventVolunteerType,
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

	// Get all groups this volunteer is a member of (with accepted status)
	const volunteerGroups = await ctx.drizzleClient
		.select({
			group: eventVolunteerGroupsTable,
		})
		.from(eventVolunteerGroupsTable)
		.innerJoin(
			eventVolunteerMembershipsTable,
			eq(eventVolunteerMembershipsTable.groupId, eventVolunteerGroupsTable.id),
		)
		.where(
			and(
				eq(eventVolunteerMembershipsTable.volunteerId, parent.id),
				eq(eventVolunteerMembershipsTable.status, "accepted"), // Only accepted group memberships
			),
		)
		.execute();

	return volunteerGroups.map((result) => result.group);
};

EventVolunteer.implement({
	fields: (t) => ({
		groups: t.field({
			description: "List of volunteer groups this volunteer is a member of.",
			resolve: EventVolunteerGroupsResolver,
			type: [EventVolunteerGroup],
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
