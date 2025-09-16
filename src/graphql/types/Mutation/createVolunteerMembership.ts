import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { eventVolunteersTable } from "~/src/drizzle/tables/EventVolunteer";
import { volunteerMembershipsTable } from "~/src/drizzle/tables/VolunteerMembership";
import { eventsTable } from "~/src/drizzle/tables/events";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import {
	VolunteerMembershipInput,
	volunteerMembershipInputSchema,
} from "~/src/graphql/inputs/VolunteerMembershipInput";
import { VolunteerMembership } from "~/src/graphql/types/VolunteerMembership/VolunteerMembership";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const mutationCreateVolunteerMembershipArgumentsSchema = z.object({
	data: volunteerMembershipInputSchema,
});

/**
 * GraphQL mutation to create a volunteer membership.
 * Based on the old Talawa API createVolunteerMembership mutation.
 */
builder.mutationField("createVolunteerMembership", (t) =>
	t.field({
		type: VolunteerMembership,
		args: {
			data: t.arg({
				required: true,
				type: VolunteerMembershipInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create a volunteer membership.",
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
			} = mutationCreateVolunteerMembershipArgumentsSchema.safeParse(args);

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

			// Check if event exists
			const event = await ctx.drizzleClient.query.eventsTable.findFirst({
				where: eq(eventsTable.id, parsedArgs.data.event),
			});

			if (!event) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["data", "event"],
							},
						],
					},
				});
			}

			// Find or create EventVolunteer record
			let volunteer = await ctx.drizzleClient
				.select()
				.from(eventVolunteersTable)
				.where(
					and(
						eq(eventVolunteersTable.userId, parsedArgs.data.userId),
						eq(eventVolunteersTable.eventId, parsedArgs.data.event),
					),
				)
				.limit(1);

			if (volunteer.length === 0) {
				// Create EventVolunteer if it doesn't exist
				const [createdVolunteer] = await ctx.drizzleClient
					.insert(eventVolunteersTable)
					.values({
						userId: parsedArgs.data.userId,
						eventId: parsedArgs.data.event,
						creatorId: currentUserId,
						hasAccepted: parsedArgs.data.status === "accepted",
						isPublic: true,
						hoursVolunteered: "0",
					})
					.returning();

				if (createdVolunteer === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				volunteer = [createdVolunteer];
			}

			// Create the volunteer membership
			if (!volunteer[0]) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			const [createdMembership] = await ctx.drizzleClient
				.insert(volunteerMembershipsTable)
				.values({
					volunteerId: volunteer[0].id,
					groupId: parsedArgs.data.group || null,
					eventId: parsedArgs.data.event,
					status: parsedArgs.data.status,
					createdBy: currentUserId,
				})
				.returning();

			if (createdMembership === undefined) {
				ctx.log.error(
					"Postgres insert operation did not return the inserted volunteer membership.",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return createdMembership;
		},
	}),
);
