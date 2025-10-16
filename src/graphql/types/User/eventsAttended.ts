import { eq } from "drizzle-orm";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { User } from "./User";
import type { User as UserType } from "./User";

export const userEventsAttendedResolver = async (
	parent: UserType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	try {
		// Get all events this user has attended (where they are registered/checked-in)
		const userAttendances =
			await ctx.drizzleClient.query.eventAttendeesTable.findMany({
				where: eq(eventAttendeesTable.userId, parent.id),
				with: {
					event: true,
					recurringEventInstance: {
						with: {
							baseRecurringEvent: true,
						},
					},
				},
			});

		// Convert to Event objects, filtering out invalid ones
		const eventsAttended = userAttendances
			.map((attendance) => {
				if (attendance.event) {
					// Standalone event
					return {
						...attendance.event,
						attachments: [],
					};
				}
				if (attendance.recurringEventInstance) {
					// Recurring event instance
					const instance = attendance.recurringEventInstance;
					return {
						...instance.baseRecurringEvent,
						...instance,
						attachments: [],
					};
				}
				return null;
			})
			.filter((event): event is NonNullable<typeof event> => event !== null);

		return eventsAttended;
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

User.implement({
	fields: (t) => ({
		eventsAttended: t.field({
			description: "List of events the user has attended or registered for.",
			resolve: userEventsAttendedResolver,
			type: [Event],
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
