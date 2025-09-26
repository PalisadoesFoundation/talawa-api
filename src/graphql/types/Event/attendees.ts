import { eq, or } from "drizzle-orm";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { Event } from "./Event";
import type { Event as EventType } from "./Event";

export const eventAttendeesResolver = async (
	parent: EventType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	try {
		// Templates don't have attendees (users can only attend actual events/instances)
		if (
			"isRecurringEventTemplate" in parent &&
			parent.isRecurringEventTemplate
		) {
			return [];
		}

		// Get all registered attendees for this event
		const attendees =
			await ctx.drizzleClient.query.eventAttendeesTable.findMany({
				where: or(
					// For standalone events
					eq(eventAttendeesTable.eventId, parent.id),
					// For recurring event instances
					eq(eventAttendeesTable.recurringEventInstanceId, parent.id),
				),
				with: {
					user: true,
				},
			});

		// Return user objects with the EventAttendee's registration timestamp
		return attendees.map((attendee) => ({
			...attendee.user,
			createdAt: attendee.createdAt, // Use EventAttendee's registration date, not User's creation date
		}));
	} catch (error) {
		ctx.log.error(error);
		throw new TalawaGraphQLError({
			message: "Internal server error",
			extensions: {
				code: "unexpected",
			},
		});
	}
};

Event.implement({
	fields: (t) => ({
		attendees: t.field({
			description: "List of users attending the event.",
			resolve: eventAttendeesResolver,
			type: [User],
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
