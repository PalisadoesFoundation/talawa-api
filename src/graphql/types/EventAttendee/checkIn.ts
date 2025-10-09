import { eq } from "drizzle-orm";
import { checkInsTable } from "~/src/drizzle/tables/checkIns";
import { CheckIn } from "~/src/graphql/types/CheckIn/CheckIn";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { EventAttendee } from "./EventAttendee";
import type { EventAttendee as EventAttendeeType } from "./EventAttendee";

export const eventAttendeeCheckInResolver = async (
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

	if (parent.checkInId === null) {
		return null;
	}

	const checkIn = await ctx.drizzleClient.query.checkInsTable.findFirst({
		where: eq(checkInsTable.id, parent.checkInId),
	});

	if (checkIn === undefined) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for an event attendee's check-in id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return checkIn;
};

EventAttendee.implement({
	fields: (t) => ({
		checkIn: t.field({
			description: "The check-in record if the attendee has checked in.",
			resolve: eventAttendeeCheckInResolver,
			type: CheckIn,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
