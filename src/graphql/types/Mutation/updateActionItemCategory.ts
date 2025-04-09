import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { actionCategoriesTable } from "~/src/drizzle/tables/actionCategories";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItemCategory } from "../ActionItemCategory/ActionItemCategory";

const mutationUpdateActionItemCategoryArgumentsSchema = z.object({
	input: z.object({
		categoryId: z.string().uuid(), // The ID of the category to update
		name: z.string().optional(), // New name
		isDisabled: z.boolean().optional(), // Enable/disable
	}),
});

export const updateActionItemCategory = builder.mutationField("updateActionItemCategory", (t) =>
	t.field({
		type: ActionItemCategory,
		args: {
			input: t.arg({
				required: true,
				type: builder.inputType("UpdateActionItemCategoryInput", {
					fields: (t) => ({
						categoryId: t.field({ type: "ID", required: true }),
						name: t.field({ type: "String" }),
						isDisabled: t.field({ type: "Boolean" }),
					}),
				}),
			}),
		},
		description: "Mutation field to update an existing Action Item Category.",
		resolve: async (_parent, args, ctx) => {
			// 1. Check user authentication
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			// 2. Validate input
			const parsedArgs =
				mutationUpdateActionItemCategoryArgumentsSchema.parse(args);
			const { categoryId, name, isDisabled } = parsedArgs.input;
			const currentUserId = ctx.currentClient.user.id;

			// 3. Find the existing category
			const existingCategory =
				await ctx.drizzleClient.query.actionCategoriesTable.findFirst({
					columns: {
						id: true,
						organizationId: true,
					},
					where: (fields, operators) => operators.eq(fields.id, categoryId),
				});

			if (!existingCategory) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "categoryId"] }],
					},
				});
			}

			// 4. Check if the user is an admin in that category's organization
			const userMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					columns: { role: true },
					where: (fields, operators) =>
						sql`${operators.eq(fields.memberId, currentUserId)}
                 AND ${operators.eq(fields.organizationId, existingCategory.organizationId)}`,
				});

			if (!userMembership || userMembership.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "categoryId"],
								message: "Only administrators can update this category.",
							},
						],
					},
				});
			}

			// Build update fields
			const updates: Record<string, unknown> = {};
			let hasUpdates = false;

			if (typeof name === "string") {
			updates.name = name;
			hasUpdates = true;
			}

			if (typeof isDisabled === "boolean") {
			updates.isDisabled = isDisabled;
			hasUpdates = true;
			}

			// Only update if there's any field to update.
			if (hasUpdates) {
			updates.updatedAt = new Date();
			// Proceed with the update operation
			} else {
			// Optionally log or handle no-op scenario: nothing to update
			}

			const [updatedCategory] = await ctx.drizzleClient
				.update(actionCategoriesTable)
				.set(updates)
				.where(eq(actionCategoriesTable.id, categoryId))
				.returning();

			if (!updatedCategory) {
				ctx.log.error(
					"Postgres update operation unexpectedly returned an empty array.",
				);
				throw new TalawaGraphQLError({ extensions: { code: "unexpected" } });
			}

			return updatedCategory;
		},
	}),
);
