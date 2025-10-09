import { eq } from "drizzle-orm";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { EventAttendee } from "~/src/graphql/types/EventAttendee/EventAttendee";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { CheckOut } from "./CheckOut";
import type { CheckOut as CheckOutType } from "./CheckOut";

export const checkOutEventAttendeeResolver = async (
	parent: CheckOutType,
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
			"Postgres select operation returned an empty array for a check-out's event attendee id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return eventAttendee;
};

CheckOut.implement({
	fields: (t) => ({
		eventAttendee: t.field({
			description: "The event attendee associated with this check-out.",
			resolve: checkOutEventAttendeeResolver,
			type: EventAttendee,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			nullable: false,
		}),
	}),
});
