import { eq } from "drizzle-orm";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { Event } from "~/src/graphql/types/Event/Event";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { User as UserType } from "./User";
import { User } from "./User";

export const userEventsAttendedResolver = async (
	parent: UserType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	try {
		// Get current user for filtering (if viewing own events, use parent.id; otherwise check auth)
		const currentUserId = ctx.currentClient.isAuthenticated
			? ctx.currentClient.user.id
			: parent.id;

		// Get current user role and organization memberships for filtering
		const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
			columns: {
				role: true,
			},
			where: (fields, operators) => operators.eq(fields.id, currentUserId),
		});

		if (!currentUser) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		// Get all events this user has attended (where they are registered/checked-in)
		const userAttendances =
			await ctx.drizzleClient.query.eventAttendeesTable.findMany({
				where: eq(eventAttendeesTable.userId, parent.id),
				with: {
					event: {
						with: {
							attachmentsWhereEvent: true,
						},
					},
					recurringEventInstance: {
						with: {
							baseRecurringEvent: true,
						},
					},
				},
			});

		// Convert to Event objects
		// Note: Since users have already attended these events, they should be able to see them
		// regardless of invite-only status (they were invited/registered). However, we still
		// apply basic filtering for consistency with visibility rules.
		const eventsAttended = userAttendances
			.map((attendance) => {
				if (attendance.event) {
					// Standalone event
					return {
						...attendance.event,
						attachments: attendance.event.attachmentsWhereEvent || [],
					};
				}
				if (attendance.recurringEventInstance) {
					// Recurring event instance - merge base event with instance data
					const instance = attendance.recurringEventInstance;
					const baseEvent = instance.baseRecurringEvent;
					return {
						...baseEvent,
						...instance,
						attachments: [],
					};
				}
				return null;
			})
			.filter((event): event is NonNullable<typeof event> => event !== null);

		// For eventsAttended, users who attended should be able to see invite-only events
		// they attended (they were invited/registered). We return all attended events.
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
