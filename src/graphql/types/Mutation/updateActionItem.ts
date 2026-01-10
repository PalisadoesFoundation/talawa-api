import { eq } from "drizzle-orm";
import { z } from "zod";
import { actionItemExceptionsTable } from "~/src/drizzle/tables/actionItemExceptions";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItem/ActionItem";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	MutationUpdateActionItemInput,
	MutationUpdateActionItemInputSchema,
} from "../../inputs/MutationUpdateActionItemInput";

const mutationUpdateActionItemArgumentsSchema = z.object({
	input: MutationUpdateActionItemInputSchema,
});

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
			} = mutationUpdateActionItemArgumentsSchema.safeParse(args);

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

			// Fetch current user and existing action item details
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
						categoryId: true,
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

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

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
				parsedArgs.input.isCompleted,
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

			if (isNotNullish(parsedArgs.input.categoryId)) {
				const categoryId = parsedArgs.input.categoryId;

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

			const currentUserOrganizationMembership =
				existingActionItem.organization.membershipsWhereOrganization[0];

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

			// Destructure the id and collect all other fields to update
			const { id: actionItemId, ...fieldsToUpdate } = parsedArgs.input;

			// Set completion timestamp if marking as completed
			const updateData = {
				...fieldsToUpdate,
				updaterId: currentUserId,
				updatedAt: new Date(),
				...(parsedArgs.input.isCompleted && { completionAt: new Date() }),
			};

			// Update the action item with all provided fields plus the updaterId
			const [updatedActionItem] = await ctx.drizzleClient
				.update(actionItemsTable)
				.set(updateData)
				.where(eq(actionItemsTable.id, actionItemId))
				.returning();

			if (updatedActionItem) {
				await ctx.drizzleClient
					.delete(actionItemExceptionsTable)
					.where(eq(actionItemExceptionsTable.actionId, actionItemId));
			}

			if (!updatedActionItem) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return updatedActionItem;
		},
		type: ActionItem,
	}),
);

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
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const { input } = args;

			// Fetch the existing action item.
			const existingActionItem =
				await ctx.drizzleClient.query.actionItemsTable.findFirst({
					where: (fields, { eq }) => eq(fields.id, input.id),
				});

			if (!existingActionItem) {
				throw new TalawaGraphQLError({
					message: "The specified action item does not exist.",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "id"] }],
					},
				});
			}

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

			const [updatedActionItem] = await ctx.drizzleClient
				.update(actionItemsTable)
				.set({
					isCompleted: false,
					postCompletionNotes: null,
					completionAt: null,
					updaterId: ctx.currentClient.user.id,
					updatedAt: new Date(),
				})
				.where(eq(actionItemsTable.id, input.id))
				.returning();

			if (updatedActionItem) {
				await ctx.drizzleClient
					.delete(actionItemExceptionsTable)
					.where(eq(actionItemExceptionsTable.actionId, input.id));
			}

			if (!updatedActionItem) {
				throw new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				});
			}

			return updatedActionItem;
		},
	}),
);
