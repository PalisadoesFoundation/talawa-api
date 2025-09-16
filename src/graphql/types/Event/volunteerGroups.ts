import { eq } from "drizzle-orm";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/EventVolunteerGroup";
import type { GraphQLContext } from "~/src/graphql/context";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import envConfig from "~/src/utilities/graphqLimits";
import { Event } from "./Event";
import type { Event as EventType } from "./Event";

export const EventVolunteerGroupsResolver = async (
	parent: EventType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new Error("Authentication required");
	}

	// Fetch all volunteer groups for this event
	const volunteerGroups = await ctx.drizzleClient
		.select()
		.from(eventVolunteerGroupsTable)
		.where(eq(eventVolunteerGroupsTable.eventId, parent.id));

	return volunteerGroups;
};

Event.implement({
	fields: (t) => ({
		volunteerGroups: t.field({
			description: "List of volunteer groups associated with this event.",
			type: t.listRef(EventVolunteerGroup),
			resolve: EventVolunteerGroupsResolver,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
