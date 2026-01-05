import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";
import {
	UpdateEventVolunteerInput,
	updateEventVolunteerInputSchema,
} from "~/src/graphql/inputs/UpdateEventVolunteerInput";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateEventVolunteerArgumentsSchema = z.object({
	id: z.string().uuid(),
	data: updateEventVolunteerInputSchema,
});

/**
 * GraphQL mutation to update an event volunteer.
 * Based on the old Talawa API updateEventVolunteer mutation.
 */
builder.mutationField("updateEventVolunteer", (t) =>
	t.field({
		type: EventVolunteer,
		args: {
			id: t.arg.id({
				required: true,
				description: "The ID of the event volunteer to update.",
			}),
			data: t.arg({
				required: false,
				type: UpdateEventVolunteerInput,
				description: "The data to update the event volunteer with.",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update an event volunteer.",
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
			} = mutationUpdateEventVolunteerArgumentsSchema.safeParse(args);

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

			// Check if current user is authorized (organization admin, event creator, or the volunteer themselves)
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
			const isVolunteerThemselves = volunteer.userId === currentUserId;

			if (!isOrgAdmin && !isEventCreator && !isVolunteerThemselves) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			// Update the volunteer
			const updateData: Partial<typeof eventVolunteersTable.$inferInsert> = {
				updaterId: currentUserId,
			};

			if (parsedArgs.data?.hasAccepted !== undefined) {
				updateData.hasAccepted = parsedArgs.data.hasAccepted;
			}

			if (parsedArgs.data?.isPublic !== undefined) {
				updateData.isPublic = parsedArgs.data.isPublic;
			}

			const [updatedVolunteer] = await ctx.drizzleClient
				.update(eventVolunteersTable)
				.set(updateData)
				.where(eq(eventVolunteersTable.id, parsedArgs.id))
				.returning();

			return updatedVolunteer;
		},
	}),
);
