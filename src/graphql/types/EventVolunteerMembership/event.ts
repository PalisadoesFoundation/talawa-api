import { eq } from "drizzle-orm";
import { eventsTable } from "~/src/drizzle/tables/events";
import { Event } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import { VolunteerMembership } from "./EventVolunteerMembership";
import type { VolunteerMembership as VolunteerMembershipType } from "./EventVolunteerMembership";

export const VolunteerMembershipEventResolver = async (
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

	const event = await ctx.drizzleClient.query.eventsTable.findFirst({
		where: eq(eventsTable.id, parent.eventId),
	});

	if (event === undefined) {
		ctx.log.warn(
			"Postgres select operation returned an empty array for a volunteer membership's event id that isn't null.",
		);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	// Return event with empty attachments array to match Event type
	return {
		...event,
		attachments: [],
	};
};

VolunteerMembership.implement({
	fields: (t) => ({
		event: t.field({
			description: "The event associated with this membership.",
			resolve: VolunteerMembershipEventResolver,
			type: Event,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
