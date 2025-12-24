import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";
import {
	UpdateEventVolunteerGroupInput,
	updateEventVolunteerGroupInputSchema,
} from "~/src/graphql/inputs/UpdateEventVolunteerGroupInput";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateEventVolunteerGroupArgumentsSchema = z.object({
	id: z.string().uuid(),
	data: updateEventVolunteerGroupInputSchema,
});

/**
 * GraphQL mutation to update an event volunteer group.
 * Based on the old Talawa API updateEventVolunteerGroup mutation.
 */
builder.mutationField("updateEventVolunteerGroup", (t) =>
	t.field({
		type: EventVolunteerGroup,
		args: {
			id: t.arg.id({
				required: true,
				description: "The ID of the event volunteer group to update.",
			}),
			data: t.arg({
				required: true,
				type: UpdateEventVolunteerGroupInput,
				description: "The data to update the event volunteer group with.",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update an event volunteer group.",
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
			} = mutationUpdateEventVolunteerGroupArgumentsSchema.safeParse(args);

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

			// Check if group exists
			const existingGroup = await ctx.drizzleClient
				.select()
				.from(eventVolunteerGroupsTable)
				.where(eq(eventVolunteerGroupsTable.id, parsedArgs.id))
				.limit(1);

			if (existingGroup.length === 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["id"],
							},
						],
					},
				});
			}

			const group = existingGroup[0];
			if (!group) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			// Get event info for authorization check
			const event = await ctx.drizzleClient.query.eventsTable.findFirst({
				where: eq(eventsTable.id, group.eventId),
			});

			if (!event) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			// Check if current user is authorized (organization admin, event creator, or group creator)
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
			const isGroupCreator = group.creatorId === currentUserId;

			if (!isOrgAdmin && !isEventCreator && !isGroupCreator) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			// Build update data
			const updateData: Partial<typeof eventVolunteerGroupsTable.$inferInsert> =
				{
					updaterId: currentUserId,
				};

			if (parsedArgs.data.name !== undefined) {
				// Check if new name conflicts with existing groups
				const nameConflict = await ctx.drizzleClient
					.select()
					.from(eventVolunteerGroupsTable)
					.where(
						and(
							eq(eventVolunteerGroupsTable.eventId, group.eventId),
							eq(eventVolunteerGroupsTable.name, parsedArgs.data.name),
							// Exclude current group from conflict check
							// Note: Using != instead of !== for SQL comparison
						),
					)
					.limit(1);

				if (nameConflict.length > 0 && nameConflict[0]?.id !== parsedArgs.id) {
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

				updateData.name = parsedArgs.data.name;
			}

			if (parsedArgs.data.description !== undefined) {
				updateData.description = parsedArgs.data.description;
			}

			if (parsedArgs.data.volunteersRequired !== undefined) {
				updateData.volunteersRequired = parsedArgs.data.volunteersRequired;
			}

			// Update the group
			const [updatedGroup] = await ctx.drizzleClient
				.update(eventVolunteerGroupsTable)
				.set(updateData)
				.where(eq(eventVolunteerGroupsTable.id, parsedArgs.id))
				.returning();

			return updatedGroup;
		},
	}),
);
