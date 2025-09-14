import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { actionItemCategoriesTable } from "~/src/drizzle/tables/actionItemCategories";
import { builder } from "~/src/graphql/builder";
import { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	MutationDeleteActionItemCategoryInput,
	mutationDeleteActionItemCategoryInputSchema,
} from "../../inputs/MutationDeleteActionItemCategoryInput";

const mutationDeleteActionItemCategoryArgumentsSchema = z.object({
	input: mutationDeleteActionItemCategoryInputSchema,
});

builder.mutationField("deleteActionItemCategory", (t) =>
	t.field({
		type: ActionItemCategory,
		args: {
			input: t.arg({
				required: true,
				type: MutationDeleteActionItemCategoryInput,
			}),
		},
		description: "Mutation field to delete an action item category.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const parsedArgs =
				mutationDeleteActionItemCategoryArgumentsSchema.parse(args);
			const currentUserId = ctx.currentClient.user.id;

			// Find the existing category
			const existingCategory =
				await ctx.drizzleClient.query.actionItemCategoriesTable.findFirst({
					with: {
						actionItemsWhereCategory: {
							columns: { id: true },
							limit: 1,
						},
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.id),
				});

			if (!existingCategory) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "id"] }],
					},
				});
			}

			// Check if category has associated action items
			if (existingCategory.actionItemsWhereCategory.length > 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
								message:
									"Cannot delete category that has associated action items.",
							},
						],
					},
				});
			}

			// Check if the user has admin privileges in the organization
			const userMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					columns: { role: true },
					where: (fields, operators) =>
						sql`${operators.eq(
							fields.memberId,
							currentUserId,
						)} AND ${operators.eq(
							fields.organizationId,
							existingCategory.organizationId,
						)}`,
				});

			if (!userMembership || userMembership.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
								message:
									"Only administrators can delete action item categories.",
							},
						],
					},
				});
			}

			const [deletedCategory] = await ctx.drizzleClient
				.delete(actionItemCategoriesTable)
				.where(eq(actionItemCategoriesTable.id, parsedArgs.input.id))
				.returning();

			if (!deletedCategory) {
				throw new TalawaGraphQLError({
					extensions: { code: "unexpected" },
				});
			}

			return deletedCategory;
		},
	}),
);
