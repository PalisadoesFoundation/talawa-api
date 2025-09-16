import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { eventVolunteersTable } from "~/src/drizzle/tables/EventVolunteer";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/EventVolunteerGroup";
import { volunteerMembershipsTable } from "~/src/drizzle/tables/VolunteerMembership";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	EventVolunteerGroupInput,
	eventVolunteerGroupInputSchema,
} from "~/src/graphql/inputs/EventVolunteerGroupInput";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const mutationCreateEventVolunteerGroupArgumentsSchema = z.object({
	data: eventVolunteerGroupInputSchema,
});

/**
 * GraphQL mutation to create an event volunteer group.
 * Based on the old Talawa API createEventVolunteerGroup mutation.
 * Implements exact same logic: reuse existing volunteers, create new ones, create group memberships.
 */
builder.mutationField("createEventVolunteerGroup", (t) =>
	t.field({
		type: EventVolunteerGroup,
		args: {
			data: t.arg({
				required: true,
				type: EventVolunteerGroupInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create an event volunteer group.",
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
			} = mutationCreateEventVolunteerGroupArgumentsSchema.safeParse(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path.map(String),
							message: issue.message,
						})),
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			// Check if leader exists
			const leader = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, parsedArgs.data.leaderId),
			});

			if (!leader) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["data", "leaderId"],
							},
						],
					},
				});
			}

			// Check if event exists and get organization info
			const event = await ctx.drizzleClient.query.eventsTable.findFirst({
				where: eq(eventsTable.id, parsedArgs.data.eventId),
			});

			if (!event) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["data", "eventId"],
							},
						],
					},
				});
			}

			// Check if current user is authorized (organization admin or event creator)
			const currentUserMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					where: and(
						eq(organizationMembershipsTable.memberId, currentUserId),
						eq(
							organizationMembershipsTable.organizationId,
							event.organizationId,
						),
					),
				});

			const isOrgAdmin = currentUserMembership?.role === "administrator";
			const isEventCreator = event.creatorId === currentUserId;

			if (!isOrgAdmin && !isEventCreator) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			// Check if group name already exists for this event
			const existingGroup = await ctx.drizzleClient
				.select()
				.from(eventVolunteerGroupsTable)
				.where(
					and(
						eq(eventVolunteerGroupsTable.eventId, parsedArgs.data.eventId),
						eq(eventVolunteerGroupsTable.name, parsedArgs.data.name),
					),
				)
				.limit(1);

			if (existingGroup.length > 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["data", "name"],
								message:
									"A volunteer group with this name already exists for this event",
							},
						],
					},
				});
			}

			// Create the volunteer group
			const [createdGroup] = await ctx.drizzleClient
				.insert(eventVolunteerGroupsTable)
				.values({
					eventId: parsedArgs.data.eventId,
					leaderId: parsedArgs.data.leaderId,
					creatorId: currentUserId,
					name: parsedArgs.data.name,
					description: parsedArgs.data.description || null,
					volunteersRequired: parsedArgs.data.volunteersRequired || null,
				})
				.returning();

			if (createdGroup === undefined) {
				ctx.log.error(
					"Postgres insert operation did not return the inserted event volunteer group.",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			// EXACT OLD API LOGIC: Fetch existing volunteers or create new ones
			if (
				parsedArgs.data.volunteerUserIds &&
				parsedArgs.data.volunteerUserIds.length > 0
			) {
				// Step 1: Find existing EventVolunteer records (matches old API line 98-101)
				const volunteers = await ctx.drizzleClient
					.select()
					.from(eventVolunteersTable)
					.where(
						and(
							inArray(
								eventVolunteersTable.userId,
								parsedArgs.data.volunteerUserIds,
							),
							eq(eventVolunteersTable.eventId, parsedArgs.data.eventId),
						),
					);

				// Step 2: Identify users who need new EventVolunteer records (matches old API line 103-106)
				const existingVolunteerUserIds = volunteers.map((vol) => vol.userId);
				const newVolunteerUserIds = parsedArgs.data.volunteerUserIds.filter(
					(id) => !existingVolunteerUserIds.includes(id),
				);

				// Step 3: Bulk create new EventVolunteer records (matches old API line 109-116)
				const newVolunteers = await ctx.drizzleClient
					.insert(eventVolunteersTable)
					.values(
						newVolunteerUserIds.map((userId) => ({
							userId,
							eventId: parsedArgs.data.eventId,
							creatorId: currentUserId,
							hasAccepted: false,
							isPublic: true,
							hoursVolunteered: "0",
						})),
					)
					.returning();

				// Step 4: Get all volunteer IDs (matches old API line 118-121)
				const allVolunteerIds = [
					...volunteers.map((v) => v.id),
					...newVolunteers.map((v) => v.id),
				];

				// Step 5: Bulk create VolunteerMembership records (matches old API line 124-132)
				await ctx.drizzleClient.insert(volunteerMembershipsTable).values(
					allVolunteerIds.map((volunteerId) => ({
						volunteerId,
						groupId: createdGroup.id, // GROUP membership
						eventId: parsedArgs.data.eventId,
						status: "invited" as const,
						createdBy: currentUserId,
					})),
				);

				ctx.log.info(
					`Created volunteer group with invitations: groupId=${createdGroup.id}, existingVolunteers=${volunteers.length}, newVolunteers=${newVolunteers.length}, totalInvited=${allVolunteerIds.length}`,
				);
			}

			return createdGroup;
		},
	}),
);
