import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { EventAttendee as EventAttendeeType } from "./EventAttendee";
import { EventAttendee } from "./EventAttendee";

export const eventAttendeeUserResolver = async (
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

	try {
		const existingUser = await ctx.drizzleClient.query.usersTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, parent.userId),
		});

		if (existingUser === undefined) {
			ctx.log.error(
				"Postgres select operation returned an empty array for an event attendee's user id that isn't null.",
			);

			throw new TalawaGraphQLError({
				extensions: {
					code: "unexpected",
				},
			});
		}

		return existingUser;
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

EventAttendee.implement({
	fields: (t) => ({
		user: t.field({
			description: "The user attending the event.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: eventAttendeeUserResolver,
			type: User,
			nullable: false,
		}),
	}),
});
