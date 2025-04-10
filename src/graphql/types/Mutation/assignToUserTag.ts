import { builder } from "~/src/graphql/builder";
import { tagAssignmentsTable, tagsTable, usersTable } from "~/src/drizzle/schema";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Zod Schemas for Input Validation
const AssignToUserTagInputSchema = z.object({
  currentTagId: z.string().uuid(),
  selectedTagIds: z.array(z.string().uuid()),
});

const assignToUserTagArgumentsSchema = z.object({
  input: AssignToUserTagInputSchema,
});

// Input Type for the Mutation
const AssignToUserTagInput = builder.inputType("AssignToUserTagInput", {
  fields: (t) => ({
    currentTagId: t.id({ required: true }),
    selectedTagIds: t.idList({ required: true }), 
  }),
});

export const assignToUserTag = async (
  _parent: any,
  args: { input: { currentTagId: string; selectedTagIds: string[] } },
  ctx: any
) => {
  console.log("Assigning tags to user:", args);
  const { data: parsedArgs, error, success } = assignToUserTagArgumentsSchema.safeParse(args);
  if (!success) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "invalid_arguments",
        issues: error.issues.map((issue) => ({
          argumentPath: issue.path,
          message: issue.message ,
        })),
      },
    });
  }
  console.log('hello 111')
  // Check Authentication
  const currentUserId = ctx.currentClient.user.id;

  const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
    columns: {
      role: true,
    },
    where: (fields, operators) => operators.eq(fields.id, currentUserId),
  });
  console.log('hello 222')
  if (!currentUser) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "unauthenticated",
      },
    });
  }
  console.log('hello 333')
  // Fetch Target Tag with Organization Details
  const existingTag = await ctx.drizzleClient.query.tagsTable.findFirst({

    where: (fields: any, operators: any) => operators.eq(fields.id, parsedArgs.input.currentTagId),
  });
  console.log('hello 41111')
  if (!existingTag) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "arguments_associated_resources_not_found",
        issues: [
          {
            argumentPath: ["input", "currentTagId"],
          },
        ],
      },
    });
  }

        if (currentUser === undefined) {
          throw new TalawaGraphQLError({
            extensions: {
              code: "unauthenticated",
            },
          });
        }
  
        if (currentUser.role !== "administrator") {
          throw new TalawaGraphQLError({
            extensions: {
              code: "unauthorized_action",
            },
          });
        }
  console.log('hello 422222')
  console.log('12345')

  // Create New Assignments
  try {
    // Validate tag exists
    const tagExists = await ctx.drizzleClient.query.tagsTable.findFirst({
      where: (fields: any, operators: any) => operators.eq(fields.id, parsedArgs.input.currentTagId),
    });

    if (!tagExists) {
      throw new TalawaGraphQLError({
        message: "Tag not found",
        extensions: {
          code: "not_found",
          argumentPath: ["input", "currentTagId"],
        },
      });
    }

    // Get existing users and create missing ones
    const userIds = parsedArgs.input.selectedTagIds;
    const existingUsers = await ctx.drizzleClient.query.usersTable.findMany({
      where: (fields: any, operators: any) => 
        operators.inArray(fields.id, userIds),
    });

    const existingUserIds = existingUsers.map(user => user.id);
    const missingUserIds = userIds.filter(id => !existingUserIds.includes(id));

    // Create missing users in a transaction
    await ctx.drizzleClient.transaction(async (tx) => {
      // Create missing users
      for (const userId of missingUserIds) {
        const email = `${userId}@placeholder.com`;
        await tx.insert(usersTable).values({
          id: userId,
          emailAddress: email,
          name: "Placeholder User",
          role: "USER",
          passwordHash: "placeholder",
          isEmailAddressVerified: false,
        });
      }

      // Create tag assignments for all users
      for (const userId of userIds) {
        const existingAssignment = await tx.query.tagAssignmentsTable.findFirst({
          where: (fields: any, operators: any) =>
            and(
              operators.eq(fields.tagId, parsedArgs.input.currentTagId),
              operators.eq(fields.assigneeId, userId)
            ),
        });

        if (!existingAssignment) {
          await tx.insert(tagAssignmentsTable).values({
            tagId: parsedArgs.input.currentTagId,
            assigneeId: userId,
            creatorId: currentUserId,
          });
        }
      }
    });
  } catch (error) {
    if (error instanceof TalawaGraphQLError) {
      throw error;
    }
    throw new TalawaGraphQLError({
      message: "Failed to assign tags to users",
      extensions: {
        code: "unexpected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
  console.log('hello 4999')
  // Return Updated Tag
  const tag = await ctx.drizzleClient.query.tagsTable.findFirst({
    columns: {
      id: true,
      name: true,
      organizationId: true,
    },
    where: (fields: any, operators: any) => operators.eq(fields.id, parsedArgs.input.currentTagId),
  });

  return tag;
};

console.log('hello 444')

builder.mutationField("assignToUserTag", (t) =>
  t.field({
    type: "Tag",
    args: {
      input: t.arg({
        type: AssignToUserTagInput,
        required: true,
      }),
    },
    resolve: assignToUserTag,
  })
);
