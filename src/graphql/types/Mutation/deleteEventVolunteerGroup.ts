import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { volunteerGroupsTable } from "~/src/drizzle/tables/volunteerGroups";
import { builder } from "~/src/graphql/builder";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	MutationDeleteEventVolunteerGroupInput,
	mutationDeleteEventVolunteerGroupInputSchema,
} from "../../inputs/MutationDeleteEventVolunteerGroupInput";
import { VolunteerGroups } from "../VolunteerGroup/VolunteerGroup";

const mutationDeleteEventVolunteerGroupArgumentsSchema = z.object({
	input: mutationDeleteEventVolunteerGroupInputSchema,
});

builder.mutationField("deleteEventVolunteerGroup", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteEventVolunteerGroupInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to delete a volunteer group.",
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
			} = mutationDeleteEventVolunteerGroupArgumentsSchema.safeParse(args);

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

			const [volunteerGroupWithEventAndUser] = await ctx.drizzleClient
				.select({
					volunteerGroup: volunteerGroupsTable,
					eventOrganizationId: eventsTable.organizationId,
					eventCreatorId: eventsTable.creatorId,
					organizationMembershipRole: organizationMembershipsTable.role,
				})
				.from(volunteerGroupsTable)
				.leftJoin(eventsTable, eq(volunteerGroupsTable.eventId, eventsTable.id))
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
				.where(eq(volunteerGroupsTable.id, parsedArgs.input.id))
				.execute();

			if (!volunteerGroupWithEventAndUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "groupId"] }],
					},
				});
			}

			const result = volunteerGroupWithEventAndUser;

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: { role: true },
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (
				currentUser?.role !== "administrator" &&
				result.organizationMembershipRole !== "administrator" &&
				currentUserId !== result.volunteerGroup.creatorId
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["input", "id"] }],
					},
				});
			}

			const [deletedGroup] = await ctx.drizzleClient
				.delete(volunteerGroupsTable)
				.where(eq(volunteerGroupsTable.id, parsedArgs.input.id))
				.returning();

			// Deleted group not being returned means that either it was deleted or its `id` column was changed by external entities before this delete operation could take place.
			if (deletedGroup === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return deletedGroup;
		},
		type: VolunteerGroups,
	}),
);
