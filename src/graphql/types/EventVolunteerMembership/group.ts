import { eq } from "drizzle-orm";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { VolunteerMembership as VolunteerMembershipType } from "./EventVolunteerMembership";
import { VolunteerMembership } from "./EventVolunteerMembership";

export const VolunteerMembershipGroupResolver = async (
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

	// If groupId is null, this is an individual volunteer membership
	if (parent.groupId === null) {
		return null;
	}

	const group = await ctx.drizzleClient
		.select()
		.from(eventVolunteerGroupsTable)
		.where(eq(eventVolunteerGroupsTable.id, parent.groupId))
		.limit(1);

	if (group.length === 0) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for a volunteer membership's group id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	const groupResult = group[0];
	if (!groupResult) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return groupResult;
};

VolunteerMembership.implement({
	fields: (t) => ({
		group: t.field({
			description:
				"The volunteer group associated with this membership (null for individual volunteers).",
			resolve: VolunteerMembershipGroupResolver,
			type: EventVolunteerGroup,
			nullable: true,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
