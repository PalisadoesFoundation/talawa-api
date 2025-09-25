import { eq } from "drizzle-orm";
import { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { CheckIn } from "./CheckIn";
import type { CheckIn as CheckInType } from "./CheckIn";

export const checkInUserResolver = async (
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

	// Get the event attendee record first
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

	// Now get the user
	const user = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) => operators.eq(fields.id, eventAttendee.userId),
	});

	if (user === undefined) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for an event attendee's user id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return user;
};

CheckIn.implement({
	fields: (t) => ({
		user: t.field({
			description: "The user who checked in.",
			resolve: checkInUserResolver,
			type: User,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			nullable: false,
		}),
	}),
});
