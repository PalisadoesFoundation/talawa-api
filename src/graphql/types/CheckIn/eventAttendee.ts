import { eq } from "drizzle-orm";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { EventAttendee } from "~/src/graphql/types/EventAttendee/EventAttendee";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { CheckIn } from "./CheckIn";
import type { CheckIn as CheckInType } from "./CheckIn";

export const checkInEventAttendeeResolver = async (
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

	return eventAttendee;
};

CheckIn.implement({
	fields: (t) => ({
		eventAttendee: t.field({
			description: "The event attendee associated with this check-in.",
			resolve: checkInEventAttendeeResolver,
			type: EventAttendee,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			nullable: false,
		}),
	}),
});
