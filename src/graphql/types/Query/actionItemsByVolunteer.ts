import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItem/ActionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	QueryActionItemsByVolunteerInput,
	queryActionItemsByVolunteerInputSchema,
} from "../../inputs/QueryActionItemInput";

const queryActionItemsByVolunteerArgumentsSchema = z.object({
	input: queryActionItemsByVolunteerInputSchema,
});

/**
 * GraphQL Query: Fetches all ActionItems assigned to a specific volunteer.
 * Optionally filters by organization.
 */
export const actionItemsByVolunteer = builder.queryField(
	"actionItemsByVolunteer",
	(t) =>
		t.field({
			args: {
				input: t.arg({
					description: "Input parameters to fetch action items by volunteerId.",
					required: true,
					type: QueryActionItemsByVolunteerInput,
				}),
			},
			description:
				"Query field to fetch all action items assigned to a specific volunteer.",
			resolve: async (_parent, args, ctx) => {
				// Check if the user is authenticated
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Validate query arguments
				const {
					data: parsedArgs,
					error,
					success,
				} = queryActionItemsByVolunteerArgumentsSchema.safeParse(args);

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

				// Fetch the current user making the request
				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				});

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Check if the volunteerId exists (target volunteer we're getting items for)
			const targetVolunteer =
				await ctx.drizzleClient.query.eventVolunteersTable.findFirst({
					columns: {
						id: true,
						userId: true,
					},
					where: (fields, operators) => {
						return operators.eq(
							fields.id,
							parsedArgs.input.volunteerId as string,
						);
					},
				});

			if (!targetVolunteer) {
				throw new TalawaGraphQLError({
					message: "The specified volunteer does not exist.",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "volunteerId"],
							},
						],
					},
				});
			}

				// Authorization check - only the volunteer's user or an administrator can query their action items
				if (
					currentUserId !== targetVolunteer.userId &&
					currentUser.role !== "administrator"
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [{ argumentPath: ["input", "volunteerId"] }],
						},
					});
				}

			// Build the query for action items
			const actionItems =
				await ctx.drizzleClient.query.actionItemsTable.findMany({
					where: (fields, operators) => {
						const conditions = [
							operators.eq(
								fields.volunteerId,
								parsedArgs.input.volunteerId as string,
							),
						];
						if (parsedArgs.input.organizationId) {
							conditions.push(
								operators.eq(
									fields.organizationId,
									parsedArgs.input.organizationId,
								),
							);
						}
						return operators.and(...conditions);
					},
				});

			// Always return an array (never null/undefined)
			return actionItems ?? [];
			},
			type: [ActionItem], // Returns an array of ActionItems
		}),
);
