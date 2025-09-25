import { eq } from "drizzle-orm";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { eventsTable } from "~/src/drizzle/tables/events";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { CheckIn } from "./CheckIn";
import type { CheckIn as CheckInType } from "./CheckIn";

export const checkInEventResolver = async (
	parent: CheckInType,
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

	// Get the event attendee record first
	const eventAttendee =
		await ctx.drizzleClient.query.eventAttendeesTable.findFirst({
			where: eq(eventAttendeesTable.id, parent.eventAttendeeId),
		});

	if (eventAttendee === undefined) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for a check-in's event attendee id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	// For now, only handle standalone events
	// TODO: Add recurring instance support later
	if (eventAttendee.eventId) {
		const event = await ctx.drizzleClient.query.eventsTable.findFirst({
			where: eq(eventsTable.id, eventAttendee.eventId),
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

		return {
			...event,
			attachments: [],
		};
	}

	// For recurring instances, return null for now
	if (eventAttendee.recurringEventInstanceId) {
		// TODO: Implement recurring instance resolution
		return null;
	}

	return null;
};

CheckIn.implement({
	fields: (t) => ({
		event: t.field({
			description: "The event associated with this check-in.",
			resolve: checkInEventResolver,
			type: Event,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
