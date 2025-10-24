import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItem/ActionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	QueryActionItemsByVolunteerGroupInput,
	queryActionItemsByVolunteerGroupInputSchema,
} from "../../inputs/QueryActionItemInput";

const queryActionItemsByVolunteerGroupArgumentsSchema = z.object({
	input: queryActionItemsByVolunteerGroupInputSchema,
});

/**
 * GraphQL Query: Fetches all ActionItems assigned to a specific volunteer group.
 * Optionally filters by organization.
 */
export const actionItemsByVolunteerGroup = builder.queryField(
	"actionItemsByVolunteerGroup",
	(t) =>
		t.field({
			args: {
				input: t.arg({
					description:
						"Input parameters to fetch action items by volunteerGroupId.",
					required: true,
					type: QueryActionItemsByVolunteerGroupInput,
				}),
			},
			description:
				"Query field to fetch all action items assigned to a specific volunteer group.",
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
				} = queryActionItemsByVolunteerGroupArgumentsSchema.safeParse(args);

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

				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Check if the volunteerGroupId exists (target group we're getting items for)
				const targetVolunteerGroup =
					await ctx.drizzleClient.query.eventVolunteerGroupsTable.findFirst({
						columns: {
							id: true,
							leaderId: true,
						},
						where: (fields, operators) => {
							return operators.eq(
								fields.id,
								parsedArgs.input.volunteerGroupId as string,
							);
						},
					});

				if (targetVolunteerGroup === undefined) {
					throw new TalawaGraphQLError({
						message: "The specified volunteer group does not exist.",
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "volunteerGroupId"] }],
						},
					});
				}

				// Authorization check - only the group leader or an administrator can query group action items
				if (
					currentUserId !== targetVolunteerGroup.leaderId &&
					currentUser.role !== "administrator"
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [{ argumentPath: ["input", "volunteerGroupId"] }],
						},
					});
				}

				// Build the query for action items
				const actionItems =
					await ctx.drizzleClient.query.actionItemsTable.findMany({
						where: (fields, operators) => {
							const conditions = [
								operators.eq(
									fields.volunteerGroupId,
									parsedArgs.input.volunteerGroupId as string,
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

				return actionItems;
			},
			type: [ActionItem], // Returns an array of ActionItems
		}),
);
