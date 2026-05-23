import { and, eq } from "drizzle-orm";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { VolunteerMembershipStatus } from "~/src/graphql/enums/VolunteerMembershipStatus";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { EventVolunteerGroup as EventVolunteerGroupType } from "./EventVolunteerGroup";
import { EventVolunteerGroup } from "./EventVolunteerGroup";

type VolunteerMembershipStatusValue =
	| "invited"
	| "requested"
	| "accepted"
	| "rejected";

export const EventVolunteerGroupVolunteersResolver = async (
	parent: EventVolunteerGroupType,
	args: { status?: VolunteerMembershipStatusValue | null },
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const status: VolunteerMembershipStatusValue = args.status ?? "accepted";

	const whereConditions = [
		eq(eventVolunteerMembershipsTable.groupId, parent.id),
		eq(eventVolunteerMembershipsTable.status, status),
	];

	// For the "accepted" status, also enforce the volunteer-level hasAccepted
	// flag — this preserves the original behavior for existing callers that
	// rely on the implicit "accepted-only" semantics of this field.
	if (status === "accepted") {
		whereConditions.push(eq(eventVolunteersTable.hasAccepted, true));
	}

	const volunteers = await ctx.drizzleClient
		.select({
			volunteer: eventVolunteersTable,
		})
		.from(eventVolunteersTable)
		.innerJoin(
			eventVolunteerMembershipsTable,
			eq(eventVolunteerMembershipsTable.volunteerId, eventVolunteersTable.id),
		)
		.where(and(...whereConditions))
		.execute();

	return volunteers.map((result) => result.volunteer);
};

EventVolunteerGroup.implement({
	fields: (t) => ({
		volunteers: t.field({
			description:
				"List of volunteers for this group. Defaults to volunteers whose membership has been accepted; pass a different status to read invited, requested, or rejected memberships.",
			args: {
				status: t.arg({
					type: VolunteerMembershipStatus,
					required: false,
					description:
						"Membership status to filter by. Defaults to 'accepted' so existing callers see the same behavior.",
				}),
			},
			resolve: EventVolunteerGroupVolunteersResolver,
			type: [EventVolunteer],
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
