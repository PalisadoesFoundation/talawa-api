import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { EventVolunteer } from "./EventVolunteer";
import type { EventVolunteer as EventVolunteerType } from "./EventVolunteer";

export const EventVolunteerUpdatedAtResolver = async (
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

	return parent.updatedAt;
};

EventVolunteer.implement({
	fields: (t) => ({
		updatedAt: t.field({
			description:
				"Date time at the time the event volunteer was last updated.",
			resolve: EventVolunteerUpdatedAtResolver,
			type: "DateTime",
			nullable: true,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
