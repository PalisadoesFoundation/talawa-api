import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteEventVolunteerArgumentsSchema = z.object({
	id: z.string().uuid(),
});

/**
 * GraphQL mutation to delete an event volunteer.
 * Based on the old Talawa API removeEventVolunteer mutation.
 */
builder.mutationField("deleteEventVolunteer", (t) =>
	t.field({
		type: EventVolunteer,
		args: {
			id: t.arg.id({
				required: true,
				description: "The ID of the event volunteer to delete.",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to delete an event volunteer.",
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
			} = mutationDeleteEventVolunteerArgumentsSchema.safeParse(args);

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

			// Check if volunteer exists
			const existingVolunteer = await ctx.drizzleClient
				.select()
				.from(eventVolunteersTable)
				.where(eq(eventVolunteersTable.id, parsedArgs.id))
				.limit(1);

			if (existingVolunteer.length === 0) {
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

			const volunteer = existingVolunteer[0];
			if (!volunteer) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			// Get event info for authorization check
			const event = await ctx.drizzleClient.query.eventsTable.findFirst({
				where: eq(eventsTable.id, volunteer.eventId),
			});

			if (!event) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
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

			// Delete related volunteer memberships first
			await ctx.drizzleClient
				.delete(eventVolunteerMembershipsTable)
				.where(eq(eventVolunteerMembershipsTable.volunteerId, parsedArgs.id));

			// Delete the volunteer
			const [deletedVolunteer] = await ctx.drizzleClient
				.delete(eventVolunteersTable)
				.where(eq(eventVolunteersTable.id, parsedArgs.id))
				.returning();

			if (deletedVolunteer === undefined) {
				ctx.log.error(
					"Postgres delete operation did not return the deleted event volunteer.",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return deletedVolunteer;
		},
	}),
);
