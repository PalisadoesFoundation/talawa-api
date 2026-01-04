import { and, eq, or } from "drizzle-orm";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { Event as EventType } from "./Event";
import { Event } from "./Event";

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

		// Get only attendees who have checked in for this event
		const attendees =
			await ctx.drizzleClient.query.eventAttendeesTable.findMany({
				where: or(
					// For standalone events
					and(
						eq(eventAttendeesTable.eventId, parent.id),
						eq(eventAttendeesTable.isCheckedIn, true),
					),
					// For recurring event instances
					and(
						eq(eventAttendeesTable.recurringEventInstanceId, parent.id),
						eq(eventAttendeesTable.isCheckedIn, true),
					),
				),
				with: {
					user: true,
				},
			});

		// Return user objects with the EventAttendee's check-in timestamp
		return attendees.map((attendee) => ({
			...attendee.user,
			createdAt: attendee.createdAt, // Use EventAttendee's check-in date, not User's creation date
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
			description: "List of users who have checked in to the event.",
			resolve: eventAttendeesResolver,
			type: [User],
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
