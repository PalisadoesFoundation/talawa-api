import { eq } from "drizzle-orm";
import { z } from "zod";
import { eventVolunteerMembershipsTable } from "~/src/drizzle/tables/eventVolunteerMemberships";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { builder } from "~/src/graphql/builder";
import { VolunteerMembership } from "~/src/graphql/types/EventVolunteerMembership/EventVolunteerMembership";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateVolunteerMembershipArgumentsSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(["invited", "requested", "accepted", "rejected"]),
});

/**
 * GraphQL mutation to update a volunteer membership status.
 * Based on the old Talawa API updateVolunteerMembership mutation.
 */
builder.mutationField("updateVolunteerMembership", (t) =>
	t.field({
		type: VolunteerMembership,
		args: {
			id: t.arg.id({
				required: true,
				description: "The ID of the volunteer membership to update.",
			}),
			status: t.arg.string({
				required: true,
				description: "The new status for the membership.",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update a volunteer membership status.",
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
			} = mutationUpdateVolunteerMembershipArgumentsSchema.safeParse(args);

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

			// Check if membership exists
			const existingMembership = await ctx.drizzleClient
				.select()
				.from(eventVolunteerMembershipsTable)
				.where(eq(eventVolunteerMembershipsTable.id, parsedArgs.id))
				.limit(1);

			if (existingMembership.length === 0) {
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

			// Update the membership status
			const [updatedMembership] = await ctx.drizzleClient
				.update(eventVolunteerMembershipsTable)
				.set({
					status: parsedArgs.status,
					updatedBy: currentUserId,
				})
				.where(eq(eventVolunteerMembershipsTable.id, parsedArgs.id))
				.returning();

			if (updatedMembership === undefined) {
				ctx.log.error(
					"Postgres update operation did not return the updated volunteer membership.",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			// If there's an existing EventVolunteer, update its hasAccepted field
			if (updatedMembership.volunteerId) {
				const hasAccepted = parsedArgs.status === "accepted";
				await ctx.drizzleClient
					.update(eventVolunteersTable)
					.set({
						hasAccepted,
						updaterId: currentUserId,
					})
					.where(eq(eventVolunteersTable.id, updatedMembership.volunteerId));
			}

			ctx.log.info(
				`Updated volunteer membership status: membershipId=${parsedArgs.id}, status=${parsedArgs.status}, volunteerId=${updatedMembership.volunteerId}`,
			);

			return updatedMembership;
		},
	}),
);
