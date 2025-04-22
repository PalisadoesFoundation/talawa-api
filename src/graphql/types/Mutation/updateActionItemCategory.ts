import { eq, sql } from "drizzle-orm";
import { actionItemCategories } from "~/src/drizzle/tables/actionItemCategories";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItemCategory } from "../ActionItemCategory/actionItemCategory";

// Import the input reference and its Zod schema from the input folder.
import {
	MutationUpdateActionItemCategoryInput,
	mutationUpdateActionItemCategoryArgumentsSchema,
} from "~/src/graphql/inputs/MutationUpdateActionItemCategory";

export const updateActionItemCategory = builder.mutationField(
	"updateActionItemCategory",
	(t) =>
		t.field({
			type: ActionItemCategory,
			args: {
				input: t.arg({
					description: "Input for updating an Action Item Category.",
					required: true,
					// Use the imported input reference.
					type: MutationUpdateActionItemCategoryInput,
				}),
			},
			description: "Mutation field to update an existing Action Item Category.",
			resolve: async (_parent, args, ctx) => {
				// 1. Check user authentication.
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: { code: "unauthenticated" },
					});
				}

				// 2. Validate the input using the imported Zod schema.
				const {
					data: parsedArgs,
					error,
					success,
				} = await mutationUpdateActionItemCategoryArgumentsSchema.safeParseAsync(
					args,
				);
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

				const { categoryId, name, isDisabled } = parsedArgs.input;
				const currentUserId = ctx.currentClient.user.id;

				// 3. Find the existing category.
				const existingCategory =
					await ctx.drizzleClient.query.actionItemCategories.findFirst({
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

				// 4. Check if the user is an admin in that category's organization.
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

				// 5. Build update fields.
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
				} else {
					// Optionally handle scenario where nothing is provided to update.
				}

				// 6. Execute the update operation.
				const [updatedCategory] = await ctx.drizzleClient
					.update(actionItemCategories)
					.set(updates)
					.where(eq(actionItemCategories.id, categoryId))
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
