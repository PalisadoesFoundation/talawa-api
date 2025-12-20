import { eq } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { EventVolunteer as EventVolunteerType } from "./EventVolunteer";
import { EventVolunteer } from "./EventVolunteer";

export const EventVolunteerCreatorResolver = async (
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

	if (parent.creatorId === null) {
		return null;
	}

	const creator = await ctx.drizzleClient.query.usersTable.findFirst({
		where: eq(usersTable.id, parent.creatorId),
	});

	if (creator === undefined) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for an event volunteer's creator id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return creator;
};

EventVolunteer.implement({
	fields: (t) => ({
		creator: t.field({
			description: "The user who created this volunteer record.",
			resolve: EventVolunteerCreatorResolver,
			type: User,
			nullable: true,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
