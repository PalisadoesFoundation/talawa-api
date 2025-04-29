import { and, eq } from "drizzle-orm";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { volunteerGroupsTable } from "~/src/drizzle/tables/volunteerGroups";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { User } from "../User/User";
import { VolunteerGroupAssignments } from "./VolunteerGroupAssignments";

VolunteerGroupAssignments.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who has created the Assignment.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				const result = await ctx.drizzleClient
					.select({
						volunteerGroup: volunteerGroupsTable,
						event: {
							organizationId: eventsTable.organizationId,
						},
						user: usersTable,
						orgMembership: {
							role: organizationMembershipsTable.role,
						},
					})
					.from(volunteerGroupsTable)
					.leftJoin(eventsTable, eq(volunteerGroupsTable.id, eventsTable.id))
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

				if (result.length === 0) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "groupId"] }],
						},
					});
				}

				const data = result[0]!;

				if (!data.event?.organizationId) {
					throw new Error("Event not found");
				}

				if (!data.user) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Check user permissions
				if (data.user.role !== "administrator" && !data.orgMembership) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				if (parent.updaterId === null) {
					return null;
				}

				if (parent.updaterId === currentUserId) {
					return data.user;
				}

				const updatorId = parent.updaterId;

				const existingUser = await ctx.drizzleClient.query.usersTable.findFirst(
					{
						where: (fields, operators) => operators.eq(fields.id, updatorId),
					},
				);

				// Creator id existing but the associated user not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingUser === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a group's updator id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingUser;
			},
			type: User,
		}),
	}),
});
