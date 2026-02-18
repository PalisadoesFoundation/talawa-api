import { eq } from "drizzle-orm";
import { usersTable } from "~/src/drizzle/tables/users";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { VolunteerMembership as VolunteerMembershipType } from "./EventVolunteerMembership";
import { VolunteerMembership } from "./EventVolunteerMembership";

export const VolunteerMembershipUpdatedByResolver = async (
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

	if (parent.updatedBy === null) {
		return null;
	}

	const updatedByUser = await ctx.drizzleClient.query.usersTable.findFirst({
		where: eq(usersTable.id, parent.updatedBy),
	});

	if (updatedByUser === undefined) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for a volunteer membership's updatedBy id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return updatedByUser;
};

VolunteerMembership.implement({
	fields: (t) => ({
		updatedBy: t.field({
			description: "The user who last updated this membership.",
			resolve: VolunteerMembershipUpdatedByResolver,
			type: User,
			nullable: true,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
