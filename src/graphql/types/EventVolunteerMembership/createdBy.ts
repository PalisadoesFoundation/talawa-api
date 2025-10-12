import { eq } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { VolunteerMembership as VolunteerMembershipType } from "./EventVolunteerMembership";
import { VolunteerMembership } from "./EventVolunteerMembership";

export const VolunteerMembershipCreatedByResolver = async (
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

	if (parent.createdBy === null) {
		return null;
	}

	const createdByUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: eq(usersTable.id, parent.createdBy),
	});

	if (createdByUser === undefined) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for a volunteer membership's createdBy id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return createdByUser;
};

VolunteerMembership.implement({
	fields: (t) => ({
		createdBy: t.field({
			description: "The user who created this membership.",
			resolve: VolunteerMembershipCreatedByResolver,
			type: User,
			nullable: true,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
