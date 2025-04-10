import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { builder } from "../../builder";
import { TalawaGraphQLError } from "../../../utilities/TalawaGraphQLError";
import { Tag } from "../Tag/Tag";
// import { isNotNullish } from "../../../utilities/isNotNullish";
import { tagAssignmentsTable } from "~/src/drizzle/schema";

const AddUserTagInputSchema = z.object({
  tagId: z.string(),
  userId: z.string(),
});

const AddUserTagInput = builder.inputType("AddUserTagInput", {
  fields: (t) => ({
    tagId: t.string({ required: true }),
    userId: t.string({ required: true }),
  }),
});

const RemoveUserTagInput = builder.inputType("RemoveUserTagInput", {
  fields: (t) => ({
    tagId: t.string({ required: true }),
    userId: t.string({ required: true }),
  }),
});

const removeUserTagInputSchema = z.object({
  tagId: z.string(),
  userId: z.string(),
});

const assignUserTagArgumentsSchema = z.object({
  input: AddUserTagInputSchema,
});

const removeUserTagArgumentsSchema = z.object({
  input: removeUserTagInputSchema,
});

builder.mutationField("assignUserTag", (t) =>
  t.field({
    args: {
      input: t.arg({
        description: "",
        required: true,
        // UPDATED: use the built input type instead of the raw schema
        type: AddUserTagInput,
      }),
    },
    description: "Mutation field to assign a tag to a user.",
    type: Tag,
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
      } = assignUserTagArgumentsSchema.safeParse(args);
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

      const [currentUser, existingTag] = await Promise.all([
        ctx.drizzleClient.query.usersTable.findFirst({
          columns: {
            role: true,
          },
          where: (fields, operators) => operators.eq(fields.id, currentUserId),
        }),
        ctx.drizzleClient.query.tagsTable.findFirst({
          columns: {
            organizationId: true,
          },
          with: {
            organization: {
              columns: {
                countryCode: true,
              },
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
          where: (fields, operators) =>
            operators.eq(fields.id, parsedArgs.input.tagId),
        }),
      ]);

      if (currentUser === undefined) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "unauthenticated",
          },
        });
      }

      if (existingTag === undefined) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "arguments_associated_resources_not_found",
            issues: [
              {
                argumentPath: ["input", "tagId"],
              },
            ],
          },
        });
      }

      const currentUserOrganizationMembership =
        existingTag.organization.membershipsWhereOrganization[0];

      if (
        currentUser.role !== "administrator" &&
        (currentUserOrganizationMembership === undefined ||
          currentUserOrganizationMembership.role !== "administrator")
      ) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "unauthorized_action_on_arguments_associated_resources",
            issues: [
              {
                argumentPath: ["input", "tagId"],
              },
            ],
          },
        });
      }

      // Check if user exists
      const userExists = await ctx.drizzleClient.query.usersTable.findFirst({
        where: (fields, operators) => 
          operators.eq(fields.id, parsedArgs.input.userId)
      });

      if (!userExists) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "arguments_associated_resources_not_found",
            issues: [
              {
                argumentPath: ["input", "userId"],
              },
            ],
          },
        });
      }

      // Check if the assignment already exists
      const existingAssignment = await ctx.drizzleClient.query.tagAssignmentsTable.findFirst({
        where: (fields, operators) =>
          and(
            operators.eq(fields.tagId, parsedArgs.input.tagId),
            operators.eq(fields.assigneeId, parsedArgs.input.userId)
          ),
      });

      if (existingAssignment !== undefined) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "forbidden_action_on_arguments_associated_resources",
            issues: [
              {
                argumentPath: ["input", "userId"],
                message: "This tag is already assigned to the user.",
              },
            ],
          },
        });
      }

      // Insert tag assignment record
      await ctx.drizzleClient.insert(tagAssignmentsTable).values({
        tagId: parsedArgs.input.tagId,
        assigneeId: parsedArgs.input.userId,
      });

      // Only return the tag object
      return ctx.drizzleClient.query.tagsTable.findFirst({
        where: (fields, operators) => operators.eq(fields.id, parsedArgs.input.tagId),
      });
    },
  })
);

// Mutation to remove a user tag
builder.mutationField("removeUserTag", (t) =>
  t.field({
    args: {
      input: t.arg({
        description: "",
        required: true,
        // UPDATED: use the built input type instead of a raw schema
        type: RemoveUserTagInput,
      }),
    },
    description: "Mutation field to remove a tag assignment from a user.",
    type: Tag,
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
      } = removeUserTagArgumentsSchema.safeParse(args);
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

      const [currentUser, existingTag] = await Promise.all([
        ctx.drizzleClient.query.usersTable.findFirst({
          columns: {
            role: true,
          },
          where: (fields, operators) => operators.eq(fields.id, currentUserId),
        }),
        ctx.drizzleClient.query.tagsTable.findFirst({
          columns: {
            organizationId: true,
          },
          with: {
            organization: {
              columns: {
                countryCode: true,
              },
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
          where: (fields, operators) =>
            operators.eq(fields.id, parsedArgs.input.tagId),
        }),
      ]);

      if (currentUser === undefined) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "unauthenticated",
          },
        });
      }

      if (existingTag === undefined) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "arguments_associated_resources_not_found",
            issues: [
              {
                argumentPath: ["input", "tagId"],
              },
            ],
          },
        });
      }

      const currentUserOrganizationMembership =
        existingTag.organization.membershipsWhereOrganization[0];

      if (
        currentUser.role !== "administrator" &&
        (currentUserOrganizationMembership === undefined ||
          currentUserOrganizationMembership.role !== "administrator")
      ) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "unauthorized_action_on_arguments_associated_resources",
            issues: [
              {
                argumentPath: ["input", "tagId"],
              },
            ],
          },
        });
      }

      // Check if user exists
      const userExists = await ctx.drizzleClient.query.usersTable.findFirst({
        where: (fields, operators) => 
          operators.eq(fields.id, parsedArgs.input.userId)
      });

      if (!userExists) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "arguments_associated_resources_not_found",
            issues: [
              {
                argumentPath: ["input", "userId"],
              },
            ],
          },
        });
      }

      // Check if the assignment exists
      const assignment = await ctx.drizzleClient.query.tagAssignmentsTable.findFirst({
        where: (fields, operators) =>
          and(
            operators.eq(fields.tagId, parsedArgs.input.tagId),
            operators.eq(fields.assigneeId, parsedArgs.input.userId)
          ),
      });

      if (assignment === undefined) {
        throw new TalawaGraphQLError({
          extensions: {
            code: "arguments_associated_resources_not_found",
            issues: [
              {
                argumentPath: ["input", "userId"],
                // message: "This tag is not assigned to the user.",
              },
            ],
          },
        });
      }

      // Remove the tag assignment
      await ctx.drizzleClient
        .delete(tagAssignmentsTable)
        .where(
          and(
            eq(tagAssignmentsTable.tagId, parsedArgs.input.tagId),
            eq(tagAssignmentsTable.assigneeId, parsedArgs.input.userId)
          )
        );

      // Only return the tag object
      return ctx.drizzleClient.query.tagsTable.findFirst({
        where: (fields, operators) => operators.eq(fields.id, parsedArgs.input.tagId),
      });
    },
  })
);