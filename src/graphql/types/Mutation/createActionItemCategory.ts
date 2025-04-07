import { sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { actionCategoriesTable } from "~/src/drizzle/tables/actionCategories";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// 1. Define your ActionItemCategory GraphQL output type (example)
import { ActionItemCategory } from "../ActionItemCategory/ActionItemCategory";

// 2. Create Zod schema for input validation
const mutationCreateActionItemCategoryArgumentsSchema = z.object({
	input: z.object({
		name: z.string().min(1, "Category name cannot be empty"),
		organizationId: z.string().uuid(),
		// Optional fields like isDisabled, if you allow it to be set:
		isDisabled: z.boolean().optional(),
	}),
});

builder.mutationField("createActionItemCategory", (t) =>
	t.field({
		type: ActionItemCategory, // The return type
		args: {
			input: t.arg({
				required: true,
				type: builder.inputType("CreateActionItemCategoryInput", {
					fields: (t) => ({
						name: t.field({ type: "String", required: true }),
						organizationId: t.field({ type: "ID", required: true }),
						isDisabled: t.field({ type: "Boolean" }), // Allow setting isDisabled from input
					}),
				}),
			}),
		},
		description: "Mutation field to create a new Action Item Category.",
		resolve: async (_parent, args, ctx) => {
			// 4. Check authentication
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			// 5. Validate input with Zod
			const parsedArgs =
				mutationCreateActionItemCategoryArgumentsSchema.parse(args);
			const currentUserId = ctx.currentClient.user.id;

			// 6. Check if the organization exists
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

			// 7. Check if the user is part of the organization
			const userMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					columns: { role: true },
					where: (fields, operators) =>
						sql`${operators.eq(fields.memberId, currentUserId)} 
                 AND ${operators.eq(fields.organizationId, parsedArgs.input.organizationId)}`,
				});

			if (!userMembership) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["input", "organizationId"] }],
					},
				});
			}

			// 8. Check if the user is an admin (similar logic as action item creation)
			if (userMembership.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
								message:
									"Only administrators can create categories for this organization.",
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
					organizationId: parsedArgs.input.organizationId,
					creatorId: currentUserId,
					isDisabled: parsedArgs.input.isDisabled ?? false,
					createdAt: new Date(),
					updatedAt: new Date(),
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
