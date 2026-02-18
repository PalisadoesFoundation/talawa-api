import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { VolunteerMembership as VolunteerMembershipType } from "./EventVolunteerMembership";
import { VolunteerMembership } from "./EventVolunteerMembership";

export const VolunteerMembershipCreatedAtResolver = async (
	parent: VolunteerMembershipType,
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

VolunteerMembership.implement({
	fields: (t) => ({
		createdAt: t.field({
			description:
				"Date time at the time the volunteer membership was created.",
			resolve: VolunteerMembershipCreatedAtResolver,
			type: "DateTime",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
