import { and, eq } from "drizzle-orm";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { VolunteerMembershipStatus } from "~/src/graphql/enums/VolunteerMembershipStatus";
import { VolunteerMembership } from "~/src/graphql/types/EventVolunteerMembership/EventVolunteerMembership";
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

export const EventVolunteerGroupMembershipsResolver = async (
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

	const whereConditions = [
		eq(eventVolunteerMembershipsTable.groupId, parent.id),
	];

	if (args.status) {
		whereConditions.push(
			eq(eventVolunteerMembershipsTable.status, args.status),
		);
	}

	const memberships = await ctx.drizzleClient
		.select()
		.from(eventVolunteerMembershipsTable)
		.where(and(...whereConditions))
		.execute();

	return memberships;
};

EventVolunteerGroup.implement({
	fields: (t) => ({
		memberships: t.field({
			description:
				"Volunteer memberships attached to this group. Returns every status (invited, requested, accepted, rejected) by default — pass `status` to narrow it. This is the field clients should use when they need to render mixed-status lists like 'pending + accepted' invites.",
			args: {
				status: t.arg({
					type: VolunteerMembershipStatus,
					required: false,
					description:
						"Optional membership status to filter by. When omitted, memberships of every status are returned.",
				}),
			},
			resolve: EventVolunteerGroupMembershipsResolver,
			type: [VolunteerMembership],
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		}),
	}),
});
