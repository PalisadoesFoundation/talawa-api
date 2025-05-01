import { eq } from "drizzle-orm";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItem/actionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import {
	MutationUpdateActionItemInput,
	mutationUpdateActionItemArgumentsSchema,
} from "../../inputs/MutationUpdateActionItemInput";

// Defines the "updateActionItem" mutation field in the GraphQL schema
builder.mutationField("updateActionItem", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Update an action item",
				required: true,
				type: MutationUpdateActionItemInput,
			}),
		},
		description: "Mutation to update an action item",
		resolve: async (_parent, args, ctx) => {
			// Authentication check
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Validate input arguments using zod schema
			const {
				data: parsedArgs,
				error,
				success,
			} = mutationUpdateActionItemArgumentsSchema.safeParse(args);

			if (!success) {
				// Throw error if validation fails
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

			// Fetch the current user and the existing action item in parallel
			const [currentUser, existingActionItem] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.actionItemsTable.findFirst({
					columns: {
						isCompleted: true,
						actionItemCategoryId: true,
						organizationId: true,
					},
					with: {
						category: {
							columns: {
								name: true,
							},
						},
						organization: {
							columns: {},
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
					where: (fields, { eq }) => eq(fields.id, parsedArgs.input.id),
				}),
			]);

			// Reject if user is not found
			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Reject if action item does not exist
			if (!existingActionItem) {
				throw new TalawaGraphQLError({
					message: "The specified action item does not exist.",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			// Helper function to validate logical constraints for completed items
			function validateActionItemTypeConstraints(
				isCompleted: boolean,
				input: {
					postCompletionNotes?: string | null;
				},
			) {
				const issues: Array<{ argumentPath: string[]; message: string }> = [];

				if (isCompleted && !input.postCompletionNotes) {
					issues.push({
						argumentPath: ["input", "postCompletionNotes"],
						message:
							"Post completion notes are required when marking as completed.",
					});
				}

				return issues;
			}

			const validationIssues = validateActionItemTypeConstraints(
				existingActionItem.isCompleted,
				parsedArgs.input,
			);

			if (validationIssues.length > 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: validationIssues,
					},
				});
			}

			// If category is being changed, ensure it exists
			if (isNotNullish(parsedArgs.input.actionItemCategoryId)) {
				const categoryId = parsedArgs.input.actionItemCategoryId;

				const existingCategory =
					await ctx.drizzleClient.query.actionItemCategoriesTable.findFirst({
						columns: {
							name: true,
						},
						where: (fields, operators) => operators.eq(fields.id, categoryId),
					});

				if (!existingCategory) {
					throw new TalawaGraphQLError({
						message: "The specified category does not exist.",
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "categoryId"],
								},
							],
						},
					});
				}
			}

			// Fetch user's role in the organization associated with the item
			const currentUserOrganizationMembership =
				existingActionItem.organization.membershipsWhereOrganization[0];

			// Authorization check: user must be admin globally or in org
			if (
				currentUser.role !== "administrator" &&
				(!currentUserOrganizationMembership ||
					currentUserOrganizationMembership.role !== "administrator")
			) {
				throw new TalawaGraphQLError({
					message: "You are not authorized to update this action item.",
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			// Destructure out id and retain rest for updating
			const { id: actionItemId, ...fieldsToUpdate } = parsedArgs.input;

			// Perform the update and return the modified row
			const [updatedActionItem] = await ctx.drizzleClient
				.update(actionItemsTable)
				.set({
					...fieldsToUpdate,
					allottedHours:
						fieldsToUpdate.allottedHours != null
							? fieldsToUpdate.allottedHours.toString()
							: undefined,
					updaterId: currentUserId,
				})
				.where(eq(actionItemsTable.id, actionItemId))
				.returning();

			if (!updatedActionItem) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			// Return the updated action item object
			return updatedActionItem;
		},
		type: ActionItem,
	}),
);

// Defines the "markActionItemAsPending" mutation field in the GraphQL schema
builder.mutationField("markActionItemAsPending", (t) =>
	t.field({
		type: ActionItem,
		args: {
			input: t.arg({
				required: true,
				type: builder.inputType("MarkActionItemAsPendingInput", {
					fields: (t) => ({
						id: t.field({ type: "ID", required: true }),
					}),
				}),
			}),
		},
		description: "Mutation to mark a completed action item as pending",
		resolve: async (_parent, args, ctx) => {
			// Authentication check
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const { input } = args;

			// Fetch the target action item by ID
			const existingActionItem =
				await ctx.drizzleClient.query.actionItemsTable.findFirst({
					where: (fields, { eq }) => eq(fields.id, input.id),
				});

			// Error if item does not exist
			if (!existingActionItem) {
				throw new TalawaGraphQLError({
					message: "The specified action item does not exist.",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "id"] }],
					},
				});
			}

			// If already pending, no update is allowed
			if (!existingActionItem.isCompleted) {
				throw new TalawaGraphQLError({
					message: "The action item is already pending.",
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
								message: "The action item is already pending.",
							},
						],
					},
				});
			}

			// Set item to pending state
			const [updatedActionItem] = await ctx.drizzleClient
				.update(actionItemsTable)
				.set({
					isCompleted: false,
					postCompletionNotes: null,
					updaterId: ctx.currentClient.user.id,
					updatedAt: new Date(),
				})
				.where(eq(actionItemsTable.id, input.id))
				.returning();

			if (!updatedActionItem) {
				throw new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				});
			}

			return updatedActionItem;
		},
	}),
);
