import { eq } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { EventVolunteerGroup as EventVolunteerGroupType } from "./EventVolunteerGroup";
import { EventVolunteerGroup } from "./EventVolunteerGroup";

export const EventVolunteerGroupUpdaterResolver = async (
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

	if (parent.updaterId === null) {
		return null;
	}

	const updater = await ctx.drizzleClient.query.usersTable.findFirst({
		where: eq(usersTable.id, parent.updaterId),
	});

	if (updater === undefined) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for an event volunteer group's updater id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return updater;
};

EventVolunteerGroup.implement({
	fields: (t) => ({
		updater: t.field({
			description: "The user who last updated this volunteer group.",
			resolve: EventVolunteerGroupUpdaterResolver,
			type: User,
			nullable: true,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
