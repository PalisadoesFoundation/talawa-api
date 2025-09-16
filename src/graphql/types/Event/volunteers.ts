import { eq } from "drizzle-orm";
import { eventVolunteersTable } from "~/src/drizzle/tables/EventVolunteer";
import type { GraphQLContext } from "~/src/graphql/context";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import envConfig from "~/src/utilities/graphqLimits";
import { Event } from "./Event";
import type { Event as EventType } from "./Event";

export const EventVolunteersResolver = async (
	parent: EventType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new Error("Authentication required");
	}

	// Fetch all volunteers for this event (same as old API - direct association)
	// In old API: event.volunteers was a direct array of EventVolunteer references
	const volunteers = await ctx.drizzleClient
		.select()
		.from(eventVolunteersTable)
		.where(eq(eventVolunteersTable.eventId, parent.id));

	return volunteers;
};

Event.implement({
	fields: (t) => ({
		volunteers: t.field({
			description: "List of all volunteers associated with this event.",
			type: t.listRef(EventVolunteer),
			resolve: EventVolunteersResolver,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
