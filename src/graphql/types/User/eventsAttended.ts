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
		// Require authentication to view attended events
		if (!ctx.currentClient.isAuthenticated) {
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
							// Note: Attachments are not fetched for recurring event instances
							// as they inherit from the base template and instance-specific
							// attachments are not currently supported in this resolver.
						},
					},
				},
			});

		// Convert to Event objects
		// Note: Since users have already attended these events, they can see them
		// regardless of invite-only status (attendance implies prior authorization).
		const eventsAttended = userAttendances
			.map((attendance) => {
				if (attendance.event) {
					// Standalone event
					// Drizzle returns an array (possibly empty) when attachmentsWhereEvent: true
					return {
						...attendance.event,
						attachments: attendance.event.attachmentsWhereEvent ?? [],
					};
				}
				if (attendance.recurringEventInstance) {
					// Recurring event instance - merge base event with instance data
					// Note: Attachments are intentionally omitted for recurring instances
					// as they inherit from the base template and instance-specific attachments
					// are not currently supported in this resolver.
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

		// Return all attended events - attendance implies prior authorization.
		return eventsAttended;
	} catch (error) {
		ctx.log.error(error);

		// Preserve TalawaGraphQLError instances to maintain proper error codes
		if (error instanceof TalawaGraphQLError) {
			throw error;
		}

		// Only wrap unknown errors as unexpected
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
