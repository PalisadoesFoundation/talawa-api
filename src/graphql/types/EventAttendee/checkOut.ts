import { eq } from "drizzle-orm";
import { checkOutsTable } from "~/src/drizzle/tables/checkOuts";
import { CheckOut } from "~/src/graphql/types/CheckOut/CheckOut";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { EventAttendee } from "./EventAttendee";
import type { EventAttendee as EventAttendeeType } from "./EventAttendee";

export const eventAttendeeCheckOutResolver = async (
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

	if (parent.checkOutId === null) {
		return null;
	}

	const checkOut = await ctx.drizzleClient.query.checkOutsTable.findFirst({
		where: eq(checkOutsTable.id, parent.checkOutId),
	});

	if (checkOut === undefined) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for an event attendee's check-out id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return checkOut;
};

EventAttendee.implement({
	fields: (t) => ({
		checkOut: t.field({
			description: "The check-out record if the attendee has checked out.",
			resolve: eventAttendeeCheckOutResolver,
			type: CheckOut,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
