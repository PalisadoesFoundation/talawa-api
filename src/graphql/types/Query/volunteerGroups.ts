import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	QueryEventVolunteerGroupsInput,
	queryEventVolunteerGroupsInputSchema,
} from "../../inputs/QueryEventVolunteerGroupsInput";
import { VolunteerGroups } from "../VolunteerGroups/VolunteerGroups";
// import { VolunteerGroupAssignment } from "../VolunteerGroupAssignment/VolunteerGroupAssignment";
const queryEventVolunteerGroupsArgumentsSchema = z.object({
	input: queryEventVolunteerGroupsInputSchema,
});

builder.queryField("getEventVolunteerGroups", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: QueryEventVolunteerGroupsInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Query field to get all volunteer groups for an event.",
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
			} = queryEventVolunteerGroupsArgumentsSchema.safeParse(args);

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
			const { eventId } = parsedArgs.input;

			if (!eventId) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "date"],
								message: "EventId is required.",
							},
						],
					},
				});
			}

			const event = await ctx.drizzleClient.query.eventsTable.findFirst({
				with: {
					organization: {
						with: {
							membershipsWhereOrganization: {
								columns: {
									role: true,
								},
								where: (fields, operators) =>
									operators.eq(fields.memberId, currentUserId),
							},
						},
					},
				},
				where: (fields, operators) => operators.eq(fields.id, eventId), // parent is the VolunteerGroup
			});

			if (event === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			const [currentUser, eventVolunteerGroups] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.volunteerGroupsTable.findMany({
					with: {
						creator: true,
						event: true,
						leader: true,
					},
					where: (fields, operators) => operators.eq(fields.eventId, eventId),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (eventVolunteerGroups === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				event.organization.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				currentUserOrganizationMembership === undefined
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			return eventVolunteerGroups;
		},
		type: [VolunteerGroups],
	}),
);
