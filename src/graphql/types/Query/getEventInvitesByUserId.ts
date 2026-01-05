import { eq } from "drizzle-orm";
import { z } from "zod";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { EventAttendee } from "~/src/graphql/types/EventAttendee/EventAttendee";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const queryGetEventInvitesByUserIdArgumentsSchema = z.object({
	userId: z.string().uuid(),
});

/**
 * GraphQL query to get all event invitations for a specific user.
 * Returns EventAttendee records where the user is invited but not yet registered.
 */
builder.queryField("getEventInvitesByUserId", (t) =>
	t.field({
		args: {
			userId: t.arg.id({
				required: true,
				description: "ID of the user",
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Query field to get all event invitations for a specific user.",
		resolve: async (_parent, args, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = queryGetEventInvitesByUserIdArgumentsSchema.safeParse(args);

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

			// Check if user exists
			const user = await ctx.drizzleClient.query.usersTable.findFirst({
				where: eq(usersTable.id, parsedArgs.userId),
			});

			if (!user) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["userId"],
							},
						],
					},
				});
			}

			// Get all event invitations for the user (where isInvited = true)
			const eventInvitations =
				await ctx.drizzleClient.query.eventAttendeesTable.findMany({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.userId, parsedArgs.userId),
							operators.eq(fields.isInvited, true),
						),
				});

			return eventInvitations;
		},
		type: [EventAttendee],
		nullable: false,
	}),
);
