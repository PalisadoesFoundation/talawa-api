import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { EventVolunteer } from "./EventVolunteer";
import type { EventVolunteer as EventVolunteerType } from "./EventVolunteer";

export const EventVolunteerCreatedAtResolver = async (
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

	return parent.createdAt;
};

EventVolunteer.implement({
	fields: (t) => ({
		createdAt: t.field({
			description: "Date time at the time the event volunteer was created.",
			resolve: EventVolunteerCreatedAtResolver,
			type: "DateTime",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
