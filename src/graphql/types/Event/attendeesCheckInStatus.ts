import { eq, or } from "drizzle-orm";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { usersTable } from "~/src/drizzle/tables/users";
import { CheckInStatus } from "~/src/graphql/types/CheckInStatus/CheckInStatus";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { Event as EventType } from "./Event";
import { Event } from "./Event";

export const eventAttendeesCheckInStatusResolver = async (
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

		// Get all attendees for this event
		const attendees =
			await ctx.drizzleClient.query.eventAttendeesTable.findMany({
				where: or(
					// For standalone events
					eq(eventAttendeesTable.eventId, parent.id),
					// For recurring event instances
					eq(eventAttendeesTable.recurringEventInstanceId, parent.id),
				),
			});

		// Manually fetch users for each attendee
		const checkInStatusList = await Promise.all(
			attendees.map(async (attendee) => {
				// Get the user
				const user = await ctx.drizzleClient.query.usersTable.findFirst({
					where: eq(usersTable.id, attendee.userId),
				});

				if (!user) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return {
					id: attendee.id,
					user: user,
					attendee: attendee,
				};
			}),
		);

		return checkInStatusList;
	} catch (error) {
		if (error instanceof TalawaGraphQLError) {
			throw error;
		}
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
		attendeesCheckInStatus: t.field({
			description: "Check-in status for all attendees of the event.",
			resolve: eventAttendeesCheckInStatusResolver,
			type: [CheckInStatus],
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			nullable: false,
		}),
	}),
});
