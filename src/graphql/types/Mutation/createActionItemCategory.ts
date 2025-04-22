import { sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { actionItemCategories } from "~/src/drizzle/tables/actionItemCategories";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

import { ActionItemCategory } from "../ActionItemCategory/actionItemCategory";

import {
	MutationCreateActionItemCategoryInput,
	mutationCreateActionItemCategoryArgumentsSchema,
} from "~/src/graphql/inputs/MutationCreateActionItemCategory";

export const createActionItemCategoryMutation = builder.mutationField(
	"createActionItemCategory",
	(t) =>
		t.field({
			type: ActionItemCategory,
			args: {
				input: t.arg({
					description:
						"Input for creating an action item category. " +
						"If isDisabled is not provided, the category will be enabled by default.",
					required: true,
					// Use the input reference imported from the input folder.
					type: MutationCreateActionItemCategoryInput,
				}),
			},
			description: "Mutation field to create a new Action Item Category.",
			resolve: async (_parent, args, ctx) => {
				// 1. Check that the client is authenticated.
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

				// 3. Check that the organization exists.
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

				// 4. Check that the user is a member of the organization.
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

				// 5. Ensure that only administrators can create categories.
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

				// 6. Insert the new category into the database.
				const [createdCategory] = await ctx.drizzleClient
					.insert(actionItemCategories)
					.values({
						id: uuidv7(),
						name: parsedArgs.input.name,
						organizationId: parsedArgs.input.organizationId,
						creatorId: currentUserId,
						// If isDisabled is provided, use it; otherwise, default to false (i.e. enabled).
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
