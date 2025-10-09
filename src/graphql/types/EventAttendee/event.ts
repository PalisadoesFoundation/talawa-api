import { eq } from "drizzle-orm";
import { eventsTable } from "~/src/drizzle/tables/events";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { EventAttendee } from "./EventAttendee";
import type { EventAttendee as EventAttendeeType } from "./EventAttendee";

export const eventAttendeeEventResolver = async (
	parent: EventAttendeeType,
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

	// For now, only handle standalone events
	// TODO: Add recurring instance support later
	if (parent.eventId) {
		const event = await ctx.drizzleClient.query.eventsTable.findFirst({
			where: eq(eventsTable.id, parent.eventId),
		});

		if (event === undefined) {
			ctx.log.warn(
				"Postgres select operation returned an empty array for an event attendee's event id that isn't null.",
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
	}

	// For recurring instances, return null for now (will implement later)
	if (parent.recurringEventInstanceId) {
		// TODO: Implement recurring instance resolution
		return null;
	}

	return null;
};

EventAttendee.implement({
	fields: (t) => ({
		event: t.field({
			description: "The event the attendee is associated with.",
			resolve: eventAttendeeEventResolver,
			type: Event,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
