import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	EventVolunteerGroupWhereInput,
	eventVolunteerGroupWhereInputSchema,
} from "../../inputs/EventVolunteerGroupWhereInput";
import { EventVolunteerGroup } from "../EventVolunteerGroup/EventVolunteerGroup";
// import { VolunteerGroupAssignment } from "../VolunteerGroupAssignment/VolunteerGroupAssignment";
const queryEventVolunteerGroupsArgumentsSchema = z.object({
	where: eventVolunteerGroupWhereInputSchema,
});

// Ensure 'capacity' is included in all event object usages and definitions below.

builder.queryField("getEventVolunteerGroups", (t) =>
	t.field({
		args: {
			where: t.arg({
				description: "Filter criteria for event volunteer groups.",
				required: true,
				type: EventVolunteerGroupWhereInput,
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

			if (!parsedArgs.where.eventId) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["where", "eventId"],
								message:
									"eventId is required to query volunteer groups for an event.",
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
				where: (fields, operators) =>
					operators.eq(fields.id, parsedArgs.where.eventId as string),
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
				ctx.drizzleClient.query.eventVolunteerGroupsTable.findMany({
					with: {
						creator: true,
						event: true,
						leader: true,
					},
					where: (fields, operators) =>
						operators.eq(fields.eventId, parsedArgs.where.eventId as string),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			let currentUserOrganizationMembership = undefined;
			if (
				event.organization &&
				Array.isArray(event.organization.membershipsWhereOrganization)
			) {
				currentUserOrganizationMembership =
					event.organization.membershipsWhereOrganization[0];
			}

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
		type: [EventVolunteerGroup],
	}),
);
