import { eq } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { EventVolunteerGroup as EventVolunteerGroupType } from "./EventVolunteerGroup";
import { EventVolunteerGroup } from "./EventVolunteerGroup";

export const EventVolunteerGroupLeaderResolver = async (
	parent: EventVolunteerGroupType,
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

	const leader = await ctx.drizzleClient.query.usersTable.findFirst({
		where: eq(usersTable.id, parent.leaderId),
	});

	if (leader === undefined) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for an event volunteer group's leader id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return leader;
};

EventVolunteerGroup.implement({
	fields: (t) => ({
		leader: t.field({
			description: "The leader of the volunteer group.",
			resolve: EventVolunteerGroupLeaderResolver,
			type: User,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
