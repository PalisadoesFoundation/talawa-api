import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { EventVolunteerGroup } from "./EventVolunteerGroup";
import type { EventVolunteerGroup as EventVolunteerGroupType } from "./EventVolunteerGroup";

export const EventVolunteerGroupCreatedAtResolver = async (
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

	return parent.createdAt;
};

EventVolunteerGroup.implement({
	fields: (t) => ({
		createdAt: t.field({
			description:
				"Date time at the time the event volunteer group was created.",
			resolve: EventVolunteerGroupCreatedAtResolver,
			type: "DateTime",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
