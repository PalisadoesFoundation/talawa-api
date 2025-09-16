import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/EventVolunteerGroup";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";
import { EventVolunteerGroup } from "~/src/graphql/types/EventVolunteerGroup/EventVolunteerGroup";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const mutationDeleteEventVolunteerGroupArgumentsSchema = z.object({
	id: z.string().uuid(),
});

/**
 * GraphQL mutation to delete an event volunteer group.
 * Based on the old Talawa API removeEventVolunteerGroup mutation.
 */
builder.mutationField("deleteEventVolunteerGroup", (t) =>
	t.field({
		type: EventVolunteerGroup,
		args: {
			id: t.arg.id({
				required: true,
				description: "The ID of the event volunteer group to delete.",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to delete an event volunteer group.",
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

			// Delete the group (cascade will handle related volunteer memberships)
			const [deletedGroup] = await ctx.drizzleClient
				.delete(eventVolunteerGroupsTable)
				.where(eq(eventVolunteerGroupsTable.id, parsedArgs.id))
				.returning();

			if (deletedGroup === undefined) {
				ctx.log.error(
					"Postgres delete operation did not return the deleted event volunteer group.",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return deletedGroup;
		},
	}),
);
