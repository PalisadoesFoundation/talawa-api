import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventVolunteersTable } from "~/src/drizzle/tables/EventVolunteer";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	EventVolunteerInput,
	eventVolunteerInputSchema,
} from "~/src/graphql/inputs/EventVolunteerInput";
import { EventVolunteer } from "~/src/graphql/types/EventVolunteer/EventVolunteer";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const mutationCreateEventVolunteerArgumentsSchema = z.object({
	data: eventVolunteerInputSchema,
});

/**
 * GraphQL mutation to create an event volunteer.
 * Based on the old Talawa API createEventVolunteer mutation.
 */
builder.mutationField("createEventVolunteer", (t) =>
	t.field({
		type: EventVolunteer,
		args: {
			data: t.arg({
				required: true,
				type: EventVolunteerInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create an event volunteer.",
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
			} = mutationCreateEventVolunteerArgumentsSchema.safeParse(args);

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

			// Check if user exists
			const user = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, parsedArgs.data.userId),
			});

			if (!user) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["data", "userId"],
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

			// Check if volunteer already exists for this event
			const existingVolunteer = await ctx.drizzleClient
				.select()
				.from(eventVolunteersTable)
				.where(
					and(
						eq(eventVolunteersTable.userId, parsedArgs.data.userId),
						eq(eventVolunteersTable.eventId, parsedArgs.data.eventId),
					),
				)
				.limit(1);

			if (existingVolunteer.length > 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["data"],
								message: "User is already a volunteer for this event",
							},
						],
					},
				});
			}

			// Create the event volunteer
			const [createdVolunteer] = await ctx.drizzleClient
				.insert(eventVolunteersTable)
				.values({
					userId: parsedArgs.data.userId,
					eventId: parsedArgs.data.eventId,
					creatorId: currentUserId,
					hasAccepted: false,
					isPublic: true,
					hoursVolunteered: "0",
				})
				.returning();

			if (createdVolunteer === undefined) {
				ctx.log.error(
					"Postgres insert operation did not return the inserted event volunteer.",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return createdVolunteer;
		},
	}),
);
