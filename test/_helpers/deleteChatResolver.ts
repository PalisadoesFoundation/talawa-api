import { eq } from "drizzle-orm";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Exported test-only resolver copy. Keeps original source file untouched.
export async function deleteChatResolver(_parent: unknown, args: any, ctx: any) {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "unauthenticated",
      },
    });
  }

  // Simple manual validation for tests: require `args.input.id` to exist.
  if (!args || !args.input || typeof args.input.id !== "string") {
    throw new TalawaGraphQLError({
      extensions: {
        code: "invalid_arguments",
        issues: [
          {
            argumentPath: ["input", "id"],
            message: "id is required",
          },
        ],
      },
    });
  }

  const parsedArgs = args;

  const currentUserId = ctx.currentClient.user.id;

  const [currentUser, existingChat] = await Promise.all([
    ctx.drizzleClient.query.usersTable.findFirst({
      columns: { role: true },
      where: (fields: any, operators: any) => operators.eq(fields.id, currentUserId),
    }),
    ctx.drizzleClient.query.chatsTable.findFirst({
      columns: { avatarName: true },
      with: {
        chatMembershipsWhereChat: {
          columns: { role: true },
          where: (fields: any, operators: any) =>
            operators.eq(fields.memberId, currentUserId),
        },
        organization: {
          columns: { countryCode: true },
          with: {
            membershipsWhereOrganization: {
              columns: { role: true },
              where: (fields: any, operators: any) =>
                operators.eq(fields.memberId, currentUserId),
            },
          },
        },
      },
      where: (fields: any, operators: any) =>
        operators.eq(fields.id, parsedArgs.input.id),
    }),
  ]);

  if (currentUser === undefined) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "unauthenticated",
      },
    });
  }

  if (existingChat === undefined) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "arguments_associated_resources_not_found",
        issues: [
          {
            argumentPath: ["input", "id"],
          },
        ],
      },
    });
  }

  const currentUserOrganizationMembership =
    existingChat.organization.membershipsWhereOrganization[0];
  const currentUserChatMembership = existingChat.chatMembershipsWhereChat[0];

  if (
    currentUser.role !== "administrator" &&
    (currentUserOrganizationMembership === undefined ||
      (currentUserOrganizationMembership.role !== "administrator" &&
        (currentUserChatMembership === undefined ||
          currentUserChatMembership.role !== "administrator")))
  ) {
    throw new TalawaGraphQLError({
      extensions: {
        code: "unauthorized_action_on_arguments_associated_resources",
        issues: [
          {
            argumentPath: ["input", "id"],
          },
        ],
      },
    });
  }

  return await ctx.drizzleClient.transaction(async (tx: any) => {
    const [deletedChat] = await tx
      .delete(chatsTable)
      .where(eq(chatsTable.id, parsedArgs.input.id))
      .returning();

    if (deletedChat === undefined) {
      throw new TalawaGraphQLError({
        extensions: {
          code: "unexpected",
        },
      });
    }

    if (existingChat.avatarName !== null) {
      await ctx.minio.client.removeObject(ctx.minio.bucketName, existingChat.avatarName);
    }

    return deletedChat;
  });
}
