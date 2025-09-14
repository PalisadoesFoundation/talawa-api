import { aliasedTable, and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { volunteerGroupAssignmentsTable } from "~/src/drizzle/tables/volunteerGroupAssignments";
import { volunteerGroupsTable } from "~/src/drizzle/tables/volunteerGroups";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	MutationCreateVolunteerGroupAssignmentsInput,
	mutationCreateVolunteerGroupAssignmentsInputSchema,
} from "../../inputs/MutationCreateVolunteerGroupAssignments";
import { VolunteerGroupAssignments } from "../VolunteerGroupAssignment/VolunteerGroupAssignment";
const mutationCreateVolunteerGroupAssignmentsArgumentsSchema = z.object({
	input: mutationCreateVolunteerGroupAssignmentsInputSchema,
});

const assigneeAlias = aliasedTable(usersTable, "assignee");
const userAlias = aliasedTable(usersTable, "user");

builder.mutationField("createEventVolunteerGroupAssignments", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateVolunteerGroupAssignmentsInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create a volunteer group assignments.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				success,
				data: parsedArgs,
				error,
			} = mutationCreateVolunteerGroupAssignmentsArgumentsSchema.safeParse(
				args,
			);

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
			const { groupId, assigneeId, eventId } = parsedArgs.input;

			// Single query to check group, assignee, and event with permissions in one go
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
						role: userAlias.role,
					},
					assignee: {
						id: assigneeAlias.id,
					},
					orgMembership: {
						role: organizationMembershipsTable.role,
					},
				})
				.from(volunteerGroupsTable)
				.leftJoin(eventsTable, eq(volunteerGroupsTable.eventId, eventsTable.id))
				.leftJoin(assigneeAlias, eq(assigneeAlias.id, assigneeId))
				.leftJoin(userAlias, eq(userAlias.id, currentUserId))
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

			// Check if event exists
			if (!result || !result.event) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "eventId"] }],
					},
				});
			}

			// Check if group belongs to the provided event
			if (result.group.eventId !== eventId) {
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
				result.orgMembership?.role !== "administrator" &&
				result.event.creatorId !== currentUserId
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			// Create the volunteer group assignment
			const groupAssignments = await ctx.drizzleClient
				.insert(volunteerGroupAssignmentsTable)
				.values({
					assigneeId: assigneeId,
					creatorId: currentUserId,
					groupId: groupId,
					inviteStatus: parsedArgs.input.inviteStatus,
				})
				.returning();

			// Check if insertion was successful
			if (!groupAssignments || groupAssignments.length === 0) {
				ctx.log.error(
					"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
				);

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return groupAssignments[0];
		},
		type: VolunteerGroupAssignments,
	}),
);
