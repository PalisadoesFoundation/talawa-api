import { sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { actionItemCategoriesTable } from "~/src/drizzle/tables/actionItemCategories";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

import { ActionItemCategory } from "../ActionItemCategory/actionItemCategory";

import {
	MutationCreateActionItemCategoryInput,
	mutationCreateActionItemCategoryArgumentsSchema,
} from "~/src/graphql/inputs/MutationCreateActionItemCategory";

/**
 * GraphQL mutation for creating a new Action Item Category.
 * Only authenticated administrators of a valid organization can create categories.
 */
export const createActionItemCategoryMutation = builder.mutationField(
	"createActionItemCategory",
	(t) =>
		t.field({
			type: ActionItemCategory,
			description: "Mutation field to create a new Action Item Category.",
			args: {
				input: t.arg({
					required: true,
					description:
						"Input for creating an action item category. " +
						"If isDisabled is not provided, the category will be enabled by default.",
					type: MutationCreateActionItemCategoryInput,
				}),
			},
			resolve: async (_parent, args, ctx) => {
				// Step 1: Ensure the request is made by an authenticated user
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: { code: "unauthenticated" },
					});
				}

				// Step 2: Validate the input using the associated Zod schema
				const {
					data: parsedArgs,
					error,
					success,
				} = await mutationCreateActionItemCategoryArgumentsSchema.safeParseAsync(
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

				const currentUserId = ctx.currentClient.user.id;

				// Step 3: Confirm that the specified organization exists
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

				// Step 4: Verify the user is a member of the organization
				const userMembership =
					await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
						columns: { role: true },
						where: (fields, operators) =>
							sql`${operators.eq(fields.memberId, currentUserId)} AND ${operators.eq(
								fields.organizationId,
								parsedArgs.input.organizationId,
							)}`,
					});

				if (!userMembership) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [{ argumentPath: ["input", "organizationId"] }],
						},
					});
				}

				// Step 5: Restrict access to administrators only
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

				// Step 6: Insert the new category into the database
				const [createdCategory] = await ctx.drizzleClient
					.insert(actionItemCategoriesTable)
					.values({
						id: uuidv7(),
						name: parsedArgs.input.name,
						organizationId: parsedArgs.input.organizationId,
						creatorId: currentUserId,
						isDisabled: parsedArgs.input.isDisabled ?? false, // Default to enabled
						createdAt: new Date(),
						updatedAt: new Date(),
					})
					.returning();

				// Step 7: Validate that the insert was successful
				if (!createdCategory) {
					ctx.log.error(
						"Postgres insert operation unexpectedly returned an empty array.",
					);
					throw new TalawaGraphQLError({ extensions: { code: "unexpected" } });
				}

				// Step 8: Return the newly created category
				return createdCategory;
			},
		}),
);
