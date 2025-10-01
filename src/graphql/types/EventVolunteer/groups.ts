import { and, eq } from "drizzle-orm";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/EventVolunteerGroup";
import { volunteerMembershipsTable } from "~/src/drizzle/tables/EventVolunteerMembership";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { EventVolunteer } from "./EventVolunteer";
import type { EventVolunteer as EventVolunteerType } from "./EventVolunteer";

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
			volunteerMembershipsTable,
			eq(volunteerMembershipsTable.groupId, eventVolunteerGroupsTable.id),
		)
		.where(
			and(
				eq(volunteerMembershipsTable.volunteerId, parent.id),
				eq(volunteerMembershipsTable.status, "accepted"), // Only accepted group memberships
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
