import { eq } from "drizzle-orm";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { VolunteerMembership as VolunteerMembershipType } from "./EventVolunteerMembership";
import { VolunteerMembership } from "./EventVolunteerMembership";

export const VolunteerMembershipVolunteerResolver = async (
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

	const volunteer = await ctx.drizzleClient
		.select()
		.from(eventVolunteersTable)
		.where(eq(eventVolunteersTable.id, parent.volunteerId))
		.limit(1);

	if (volunteer.length === 0) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for a volunteer membership's volunteer id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	const volunteerResult = volunteer[0];
	if (!volunteerResult) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return volunteerResult;
};

VolunteerMembership.implement({
	fields: (t) => ({
		volunteer: t.field({
			description: "The event volunteer associated with this membership.",
			resolve: VolunteerMembershipVolunteerResolver,
			type: EventVolunteer,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
