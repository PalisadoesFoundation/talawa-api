import { sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { actionCategoriesTable } from "~/src/drizzle/tables/actionCategories";
import { builder } from "~/src/graphql/builder";
import { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	MutationCreateActionItemCategoryInput,
	mutationCreateActionItemCategoryInputSchema,
} from "../../inputs/MutationCreateActionItemCategoryInput";

const mutationCreateActionItemCategoryArgumentsSchema = z.object({
	input: mutationCreateActionItemCategoryInputSchema,
});

builder.mutationField("createActionItemCategory", (t) =>
	t.field({
		type: ActionItemCategory,
		args: {
			input: t.arg({
				required: true,
				type: MutationCreateActionItemCategoryInput,
			}),
		},
		description: "Mutation field to create an action item category.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const parsedArgs =
				mutationCreateActionItemCategoryArgumentsSchema.parse(args);
			const currentUserId = ctx.currentClient.user.id;

			// Check if the organization exists
			const existingOrganization =
				await ctx.drizzleClient.query.organizationsTable.findFirst({
					columns: { id: true },
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.organizationId),
				});

			if (!existingOrganization) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "organizationId"] }],
					},
				});
			}

			// Check if the user is part of the organization and has admin privileges
			const userMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					columns: { role: true },
					where: (fields, operators) =>
						sql`${operators.eq(
							fields.memberId,
							currentUserId,
						)} AND ${operators.eq(
							fields.organizationId,
							parsedArgs.input.organizationId,
						)}`,
				});

			if (!userMembership || userMembership.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
								message:
									"Only administrators can create action item categories.",
							},
						],
					},
				});
			}

			// Check if category name already exists in the organization
			const existingCategory =
				await ctx.drizzleClient.query.actionCategoriesTable.findFirst({
					columns: { id: true },
					where: (fields, operators) =>
						sql`${operators.eq(
							fields.name,
							parsedArgs.input.name,
						)} AND ${operators.eq(
							fields.organizationId,
							parsedArgs.input.organizationId,
						)}`,
				});

			if (existingCategory) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "name"],
								message:
									"A category with this name already exists in this organization.",
							},
						],
					},
				});
			}

			const [createdCategory] = await ctx.drizzleClient
				.insert(actionCategoriesTable)
				.values({
					id: uuidv7(),
					name: parsedArgs.input.name,
					description: parsedArgs.input.description || null,
					organizationId: parsedArgs.input.organizationId,
					isDisabled: parsedArgs.input.isDisabled || false,
					creatorId: currentUserId,
					createdAt: new Date(),
					updatedAt: new Date(),
					updaterId: currentUserId,
				})
				.returning();

			if (!createdCategory) {
				ctx.log.error(
					"Postgres insert operation unexpectedly returned an empty array.",
				);
				throw new TalawaGraphQLError({ extensions: { code: "unexpected" } });
			}

			return createdCategory;
		},
	}),
);
