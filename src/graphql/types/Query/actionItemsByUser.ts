import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItem/ActionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	QueryActionItemsByUserInput,
	queryActionItemsByUserInputSchema,
} from "../../inputs/QueryActionItemInput";

const queryActionItemsByUserArgumentsSchema = z.object({
	input: queryActionItemsByUserInputSchema,
});

/**
 * GraphQL Query: Fetches all ActionItems assigned to a specific user.
 * Optionally filters by organization.
 */
export const actionItemsByUser = builder.queryField("actionItemsByUser", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input parameters to fetch action items by userId.",
				required: true,
				type: QueryActionItemsByUserInput,
			}),
		},
		description:
			"Query field to fetch all action items assigned to a specific user.",
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
			} = queryActionItemsByUserArgumentsSchema.safeParse(args);

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

			// Check if the userId exists (target user we're getting items for)
			const targetUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: {
					id: true,
				},
				where: (fields, operators) => {
					// Fix: Use non-nullable string comparison
					return operators.eq(fields.id, parsedArgs.input.userId as string);
				},
			});

			if (targetUser === undefined) {
				throw new TalawaGraphQLError({
					message: "The specified user does not exist.",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "userId"] }],
					},
				});
			}

			// Build the query for action items
			const actionItemsQueryBuilder =
				ctx.drizzleClient.query.actionsTable.findMany({
					with: {
						assignee: true,
						category: true,
						creator: true,
						event: true,
						organization: {
							columns: {
								countryCode: true,
							},
							with: {
								membershipsWhereOrganization: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.memberId, currentUserId),
								},
							},
						},
					},
					where: (fields, operators) => {
						// Fix: Handle nullable fields properly
						const userId = parsedArgs.input.userId as string;

						// Start with the base condition
						const baseCondition = operators.eq(fields.assigneeId, userId);

						// Add organization filter if provided
						if (parsedArgs.input.organizationId) {
							const orgId = parsedArgs.input.organizationId;
							return operators.and(
								baseCondition,
								operators.eq(fields.organizationId, orgId),
							);
						}

						return baseCondition;
					},
				});

			// Execute the query
			const actionItems = await actionItemsQueryBuilder;

			// If no action items found, return an empty array
			if (!actionItems.length) {
				return [];
			}

			// Check permissions
			// If current user is the target user, they can see their own action items
			if (currentUserId === parsedArgs.input.userId) {
				return actionItems;
			}

			// If current user is an admin, they can see any user's action items
			if (currentUser.role === "administrator") {
				return actionItems;
			}

			// Check if organization ID was provided and validate membership
			if (parsedArgs.input.organizationId) {
				const currentUserOrganizationMembership =
					actionItems[0]?.organization?.membershipsWhereOrganization?.[0];

				// User must be an admin in the organization to view another user's action items
				if (
					!currentUserOrganizationMembership ||
					currentUserOrganizationMembership.role !== "administrator"
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [{ argumentPath: ["input", "userId"] }],
						},
					});
				}
			} else {
				// If no organization specified, only admins can view other users' action items
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["input", "userId"] }],
					},
				});
			}

			return actionItems;
		},
		type: [ActionItem], // Returns an array of ActionItems
	}),
);
