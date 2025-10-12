import { eq } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { EventVolunteer as EventVolunteerType } from "./EventVolunteer";
import { EventVolunteer } from "./EventVolunteer";

export const EventVolunteerUserResolver = async (
	parent: EventVolunteerType,
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

	const user = await ctx.drizzleClient.query.usersTable.findFirst({
		where: eq(usersTable.id, parent.userId),
	});

	if (user === undefined) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for an event volunteer's user id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return user;
};

EventVolunteer.implement({
	fields: (t) => ({
		user: t.field({
			description: "The user who is volunteering for the event.",
			resolve: EventVolunteerUserResolver,
			type: User,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
