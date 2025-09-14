import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { volunteerGroupsTable } from "~/src/drizzle/tables/volunteerGroups";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	QueryVolunteerGroupAssignmentsInput,
	queryVolunteerGroupAssignmentsInputSchema,
} from "../../inputs/QueryVolunteerGroupAssignments";
import { VolunteerGroupAssignments } from "../VolunteerGroupAssignment/VolunteerGroupAssignment";
const queryEventVolunteerGroupAssignmentsArgumentsSchema = z.object({
	input: queryVolunteerGroupAssignmentsInputSchema,
});

builder.queryField("getEventVolunteerGroupAssignments", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QueryVolunteerGroupAssignmentsInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Query field to get all volunteer of a group.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = queryEventVolunteerGroupAssignmentsArgumentsSchema.safeParse(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;
			const { groupId, eventId, assigneeId } = parsedArgs.input;

			if (groupId) {
				const [result] = await ctx.drizzleClient
					.select({
						group: {
							eventId: volunteerGroupsTable.eventId,
							creatorId: volunteerGroupsTable.creatorId,
						},
						event: {
							organizationId: eventsTable.organizationId,
							creatorId: eventsTable.creatorId,
						},
						user: {
							role: usersTable.role,
						},
						orgMembership: {
							role: organizationMembershipsTable.role,
						},
					})
					.from(volunteerGroupsTable)
					.leftJoin(eventsTable, eq(volunteerGroupsTable.eventId, eventsTable.id))
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
					.where(eq(volunteerGroupsTable.id, groupId))
					.execute();

				// Check if volunteer group exists
				if (!result || !result.group) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "groupId"] }],
						},
					});
				}

				// Check if user exists and has permissions
				if (!result.user) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Check authorization
				if (
					result.user.role !== "administrator" &&
					result.orgMembership?.role !== "administrator"
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				const volunteerGroupAssignments =
					await ctx.drizzleClient.query.volunteerGroupAssignmentsTable.findMany({
						where: (fields, operators) => operators.eq(fields.groupId, groupId),
					});

				return volunteerGroupAssignments;
			}

			if (eventId) {
				const [result] = await ctx.drizzleClient
					.select({
						event: {
							organizationId: eventsTable.organizationId,
							creatorId: eventsTable.creatorId,
						},
						user: {
							role: usersTable.role,
						},
						orgMembership: {
							role: organizationMembershipsTable.role,
						},
					})
					.from(eventsTable)
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
					.where(eq(eventsTable.id, eventId))
					.execute();

				if (!result || !result.event) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "eventId"] }],
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

				if (
					result.user.role !== "administrator" &&
					result.orgMembership?.role !== "administrator"
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				const volunteerGroupAssignments =
					await ctx.drizzleClient.query.volunteerGroupAssignmentsTable.findMany({
						where: (fields) =>
							inArray(
								fields.groupId,
								ctx.drizzleClient
									.select({ id: volunteerGroupsTable.id })
									.from(volunteerGroupsTable)
									.where(eq(volunteerGroupsTable.eventId, eventId)),
							),
					});
				return volunteerGroupAssignments;
			}

			if (assigneeId) {
				if (assigneeId !== currentUserId) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}
				const volunteerGroupAssignments =
					await ctx.drizzleClient.query.volunteerGroupAssignmentsTable.findMany({
						where: (fields, operators) =>
							operators.eq(fields.assigneeId, assigneeId),
					});
				return volunteerGroupAssignments;
			}

			return [];
		},
		type: [VolunteerGroupAssignments],
	}),
);
