import { eq } from "drizzle-orm";
import { eventsTable } from "~/src/drizzle/tables/events";
import { Event } from "~/src/graphql/types/Event/Event";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { EventVolunteerGroup as EventVolunteerGroupType } from "./EventVolunteerGroup";
import { EventVolunteerGroup } from "./EventVolunteerGroup";

export const EventVolunteerGroupEventResolver = async (
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

	const event = await ctx.drizzleClient.query.eventsTable.findFirst({
		where: eq(eventsTable.id, parent.eventId),
	});

	if (event === undefined) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for an event volunteer group's event id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	// Return event with empty attachments array to match Event type
	return {
		...event,
		attachments: [],
	};
};

EventVolunteerGroup.implement({
	fields: (t) => ({
		event: t.field({
			description: "The event this volunteer group is for.",
			resolve: EventVolunteerGroupEventResolver,
			type: Event,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
