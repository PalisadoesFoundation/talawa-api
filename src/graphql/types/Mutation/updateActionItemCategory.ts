import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { actionCategoriesTable } from "~/src/drizzle/tables/actionCategories";
import { builder } from "~/src/graphql/builder";
import { ActionItemCategory } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
  MutationUpdateActionItemCategoryInput,
  mutationUpdateActionItemCategoryInputSchema,
} from "../../inputs/MutationUpdateActionItemCategoryInput";

const mutationUpdateActionItemCategoryArgumentsSchema = z.object({
  input: mutationUpdateActionItemCategoryInputSchema,
});

builder.mutationField("updateActionItemCategory", (t) =>
  t.field({
    type: ActionItemCategory,
    args: {
      input: t.arg({
        required: true,
        type: MutationUpdateActionItemCategoryInput,
      }),
    },
    description: "Mutation field to update an action item category.",
    resolve: async (_parent, args, ctx) => {
      if (!ctx.currentClient.isAuthenticated) {
        throw new TalawaGraphQLError({
          extensions: { code: "unauthenticated" },
        });
      }

      const parsedArgs =
        mutationUpdateActionItemCategoryArgumentsSchema.parse(args);
      const currentUserId = ctx.currentClient.user.id;

      // Find the existing category
      const existingCategory =
        await ctx.drizzleClient.query.actionCategoriesTable.findFirst({
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

      // Check if the user has admin privileges in the organization
      const userMembership =
        await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
          columns: { role: true },
          where: (fields, operators) =>
            sql`${operators.eq(
              fields.memberId,
              currentUserId
            )} AND ${operators.eq(
              fields.organizationId,
              existingCategory.organizationId
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
                  "Only administrators can update action item categories.",
              },
            ],
          },
        });
      }

      // If name is being updated, check for duplicates
      if (
        parsedArgs.input.name !== undefined &&
        parsedArgs.input.name !== existingCategory.name
      ) {
        const duplicateCategory =
          await ctx.drizzleClient.query.actionCategoriesTable.findFirst({
            columns: { id: true },
            where: (fields, operators) =>
              sql`${operators.eq(
                fields.name,
                parsedArgs.input.name!
              )} AND ${operators.eq(
                fields.organizationId,
                existingCategory.organizationId
              )} AND ${operators.ne(fields.id, parsedArgs.input.id)}`,
          });

        if (duplicateCategory) {
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
      }

      // Build update object with only provided fields
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
        updaterId: currentUserId,
      };

      if (parsedArgs.input.name !== undefined) {
        updateData.name = parsedArgs.input.name;
      }
      if (parsedArgs.input.description !== undefined) {
        updateData.description = parsedArgs.input.description;
      }
      if (parsedArgs.input.isDisabled !== undefined) {
        updateData.isDisabled = parsedArgs.input.isDisabled;
      }

      const [updatedCategory] = await ctx.drizzleClient
        .update(actionCategoriesTable)
        .set(updateData)
        .where(eq(actionCategoriesTable.id, parsedArgs.input.id))
        .returning();

      if (!updatedCategory) {
        throw new TalawaGraphQLError({
          extensions: { code: "unexpected" },
        });
      }

      return updatedCategory;
    },
  })
);
