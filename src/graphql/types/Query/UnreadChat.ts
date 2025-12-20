/*
 * Query to get all chats with unread messages for the current user.
 */
import { and, eq, exists, gt, sql } from "drizzle-orm";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import { chatMessagesTable } from "~/src/drizzle/tables/chatMessages";
import { builder } from "~/src/graphql/builder";
import { Chat } from "~/src/graphql/types/Chat/Chat";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

builder.queryField("unreadChats", (t) =>
	t.field({
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Query to get all chats with unread messages for the current user.",
		resolve: async (_parent, _args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			// Return chats where the current user is a member and there exists
			// at least one message with createdAt > lastReadAt
			const unreadChats = await ctx.drizzleClient.query.chatsTable.findMany({
				where: (fields, _operators) =>
					exists(
						ctx.drizzleClient
							.select()
							.from(chatMembershipsTable)
							.where(
								and(
									eq(chatMembershipsTable.chatId, fields.id),
									eq(chatMembershipsTable.memberId, currentUserId),
									exists(
										ctx.drizzleClient
											.select()
											.from(chatMessagesTable)
											.where(
												and(
													eq(chatMessagesTable.chatId, fields.id),
													gt(
														chatMessagesTable.createdAt,
														sql`COALESCE(${chatMembershipsTable.lastReadAt}, to_timestamp(0))`,
													),
												),
											),
									),
								),
							),
					),
			});

			return unreadChats;
		},
		type: [Chat],
	}),
);
