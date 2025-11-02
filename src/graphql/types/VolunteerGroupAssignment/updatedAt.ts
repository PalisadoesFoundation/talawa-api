import { and, eq } from "drizzle-orm";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { volunteerGroupsTable } from "~/src/drizzle/tables/volunteerGroups";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import type { GraphQLContext } from "../../context";
import {
	VolunteerGroupAssignments,
	type VolunteerGroupAssignments as VolunteerGroupAssignmentsType,
} from "./VolunteerGroupAssignment";

export const resolveUpdatedAt = async (
	parent: VolunteerGroupAssignmentsType,
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

	const currentUserId = ctx.currentClient.user.id;

	const [result] = await ctx.drizzleClient
		.select({
			volunteerGroup: volunteerGroupsTable,
			event: {
				organizationId: eventsTable.organizationId,
			},
			user: {
				id: usersTable.id,
				role: usersTable.role,
			},
			orgMembership: {
				role: organizationMembershipsTable.role,
			},
		})
		.from(volunteerGroupsTable)
		.leftJoin(eventsTable, eq(eventsTable.id, volunteerGroupsTable.eventId))
		.leftJoin(usersTable, eq(usersTable.id, currentUserId))
		.leftJoin(
			organizationMembershipsTable,
			and(
				eq(
					organizationMembershipsTable.organizationId,
					eventsTable.organizationId,
				),
				eq(organizationMembershipsTable.memberId, currentUserId),
			),
		)
		.where(eq(volunteerGroupsTable.id, parent.groupId))
		.execute();

	if (result === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [{ argumentPath: ["input", "groupId"] }],
			},
		});
	}

	if (!result.user) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	// Check user permissions
	if (result.user.role !== "administrator" && !result.orgMembership) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	return parent.updatedAt;
};

VolunteerGroupAssignments.implement({
	fields: (t) => ({
		updatedAt: t.field({
			description:
				"Date time at the time the Group Assignment was last updated.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: resolveUpdatedAt,
			type: "DateTime",
		}),
	}),
});
