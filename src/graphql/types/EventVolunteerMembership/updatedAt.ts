import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { VolunteerMembership as VolunteerMembershipType } from "./EventVolunteerMembership";
import { VolunteerMembership } from "./EventVolunteerMembership";

export const VolunteerMembershipUpdatedAtResolver = async (
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

	return parent.updatedAt;
};

VolunteerMembership.implement({
	fields: (t) => ({
		updatedAt: t.field({
			description:
				"Date time at the time the volunteer membership was last updated.",
			resolve: VolunteerMembershipUpdatedAtResolver,
			type: "DateTime",
			nullable: true,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
