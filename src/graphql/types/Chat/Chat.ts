import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { chatMessagesTable } from "~/src/drizzle/tables/chatMessages";
import type { chatsTable } from "~/src/drizzle/tables/chats";
import { builder } from "~/src/graphql/builder";
import { ChatMessage } from "~/src/graphql/types/ChatMessage/ChatMessage";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

export type Chat = typeof chatsTable.$inferSelect;

export const Chat = builder.objectRef<Chat>("Chat");

Chat.implement({
	description:
		"Chats are controlled spaces within organizations where their members can communicate with each other in realtime.",
	fields: (t) => ({
		avatarMimeType: t.exposeString("avatarMimeType", {
			description: "Mime type of the avatar of the chat.",
		}),
		description: t.exposeString("description", {
			description: "Custom information about the chat.",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the chat.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the chat.",
		}),
		//this field beneath here contains N+1 Queries so this not used by default . 
		//if someone wants to use it they can explicitly ask for it in the query but this needs to be optimized later . 
		unreadMessagesCount: t.int({
			description:
				"Number of unread messages for the current user in this chat.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: { code: "unauthenticated" },
					});
				}

				const currentUserId = ctx.currentClient.user.id;
				const membership =
					await ctx.drizzleClient.query.chatMembershipsTable.findFirst({
						where: (fields, operators) =>
							and(
								operators.eq(fields.chatId, parent.id),
								operators.eq(fields.memberId, currentUserId),
							),
					});

				if (!membership) return 0;
				const lastReadAt = membership.lastReadAt ?? new Date(0);

				const countRes = await ctx.drizzleClient
					.select({ cnt: sql<number>`COUNT(*)::int` })
					.from(chatMessagesTable)
					.where(
						and(
							eq(chatMessagesTable.chatId, parent.id),
							gt(chatMessagesTable.createdAt, lastReadAt),
						),
					);
				return countRes[0]?.cnt ?? 0;
			},
		}),
		hasUnread: t.boolean({
			description: "Whether the current user has unread messages in this chat.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: { code: "unauthenticated" },
					});
				}
				const currentUserId = ctx.currentClient.user.id;
				const membership =
					await ctx.drizzleClient.query.chatMembershipsTable.findFirst({
						where: (fields, operators) =>
							and(
								operators.eq(fields.chatId, parent.id),
								operators.eq(fields.memberId, currentUserId),
							),
					});
				if (!membership) return false;
				const lastReadAt = membership.lastReadAt ?? new Date(0);

				const found = await ctx.drizzleClient
					.select({ id: chatMessagesTable.id })
					.from(chatMessagesTable)
					.where(
						and(
							eq(chatMessagesTable.chatId, parent.id),
							gt(chatMessagesTable.createdAt, lastReadAt),
						),
					)
					.limit(1);
				return found.length > 0;
			},
		}),
		firstUnreadMessageId: t.id({
			description:
				"ID of the first unread message for the current user in this chat, if any.",
			nullable: true,
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: { code: "unauthenticated" },
					});
				}
				const currentUserId = ctx.currentClient.user.id;
				const membership =
					await ctx.drizzleClient.query.chatMembershipsTable.findFirst({
						where: (fields, operators) =>
							and(
								operators.eq(fields.chatId, parent.id),
								operators.eq(fields.memberId, currentUserId),
							),
					});
				if (!membership) return null;
				const lastReadAt = membership.lastReadAt ?? new Date(0);

				const firstUnread = await ctx.drizzleClient
					.select({ id: chatMessagesTable.id })
					.from(chatMessagesTable)
					.where(
						and(
							eq(chatMessagesTable.chatId, parent.id),
							gt(chatMessagesTable.createdAt, lastReadAt),
						),
					)
					.orderBy(asc(chatMessagesTable.createdAt))
					.limit(1);

				return firstUnread[0]?.id ?? null;
			},
		}),
		lastMessage: t.field({
			description: "Most recent message in this chat.",
			nullable: true,
			type: ChatMessage,
			resolve: async (parent, _args, ctx) => {
				const last = await ctx.drizzleClient
					.select()
					.from(chatMessagesTable)
					.where(eq(chatMessagesTable.chatId, parent.id))
					.orderBy(desc(chatMessagesTable.createdAt))
					.limit(1);
				return last[0] ?? null;
			},
		}),
	}),
});
