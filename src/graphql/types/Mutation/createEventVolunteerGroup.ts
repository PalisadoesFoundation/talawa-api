import { z } from "zod";
import { volunteerGroupAssignmentsTable } from "~/src/drizzle/tables/volunteerGroupAssignments";
import { volunteerGroupsTable } from "~/src/drizzle/tables/volunteerGroups";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	MutationCreateVolunteerGroupInput,
	mutationCreateVolunteerGroupInputSchema,
} from "../../inputs/MutationCreateEventVolunteerGroupInput";
import { VolunteerGroups } from "../VolunteerGroups/VolunteerGroups";
const mutationCreateVolunteerGroupArgumentsSchema = z.object({
	input: mutationCreateVolunteerGroupInputSchema,
});

builder.mutationField("createEventVolunteerGroup", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateVolunteerGroupInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create a volunteer group.",
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
			} = mutationCreateVolunteerGroupArgumentsSchema.safeParse(args);

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

			const existingEvent = await ctx.drizzleClient.query.eventsTable.findFirst(
				{
					columns: {
						organizationId: true,
						creatorId: true,
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.eventId), // parent is the VolunteerGroup
				},
			);

			if (existingEvent === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "eventId"],
							},
						],
					},
				});
			}

			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				with: {
					organizationMembershipsWhereMember: {
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.organizationId, existingEvent.organizationId),
					},
				},
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			});

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const currentUserOrganizationMembership =
				currentUser.organizationMembershipsWhereMember[0];

			if (
				currentUser.role !== "administrator" &&
				currentUserOrganizationMembership?.role !== "administrator" &&
				existingEvent.creatorId !== currentUserId
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			const [volunteerGroup] = await ctx.drizzleClient
				.insert(volunteerGroupsTable)
				.values({
					creatorId: currentUserId,
					eventId: parsedArgs.input.eventId,
					leaderId: parsedArgs.input.leaderId,
					maxVolunteerCount: parsedArgs.input.maxVolunteerCount,
					name: parsedArgs.input.name,
				})
				.returning();

			// Inserted venue booking not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (volunteerGroup === undefined) {
				ctx.log.error(
					"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
				);

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			await ctx.drizzleClient
				.insert(volunteerGroupAssignmentsTable)
				.values({
					assigneeId: parsedArgs.input.leaderId || "",
					creatorId: currentUserId,
					groupId: volunteerGroup.id,
					inviteStatus: "no_response",
				})
				.returning();

			return volunteerGroup;
		},
		type: VolunteerGroups,
	}),
);
