import { and, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { z } from "zod";
import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import { chatMessageReadReceiptsTable } from "~/src/drizzle/tables/chatMessageReadReceipts";
import {
	MutationMarkChatAsReadInput,
	mutationMarkChatAsReadInputSchema,
} from "~/src/graphql/inputs/MutationMarkChatAsReadInput";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { builder } from "../../builder";

const mutationMarkChatAsReadArgumentSchema = z.object({
	input: mutationMarkChatAsReadInputSchema,
});

builder.mutationField("markChatAsRead", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "The input for marking a chat as read",
				required: true,
				type: MutationMarkChatAsReadInput,
			}),
		},
		description: "Marks a chat as read",
		type: "Boolean",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}
			const {
				data: parsedArgs,
				error,
				success,
			} = mutationMarkChatAsReadArgumentSchema.safeParse(args);
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
			const [user, chat, message] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: { name: true },
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.chatsTable.findFirst({
					columns: { id: true },
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.chatId),
				}),
				ctx.drizzleClient.query.chatMessagesTable.findFirst({
					columns: { id: true },
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.messageId),
				}),
			]);
			if (!user) {
				throw new GraphQLError("User not found", {
					extensions: { code: "unauthenticated" },
				});
			}
			if (!chat) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "chatId"] }],
					},
				});
			}
			if (!message) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "messageId"] }],
					},
				});
			}

			const membership =
				await ctx.drizzleClient.query.chatMembershipsTable.findFirst({
					where: (fields, operators) =>
						and(
							operators.eq(fields.chatId, parsedArgs.input.chatId),
							operators.eq(fields.memberId, currentUserId),
						),
				});

			if (!membership) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["input", "chatId"] }],
					},
				});
			}

			await ctx.drizzleClient.transaction(async (tx) => {
				await tx
					.update(chatMembershipsTable)
					.set({ lastReadAt: new Date() })
					.where(
						and(
							eq(chatMembershipsTable.chatId, parsedArgs.input.chatId),
							eq(chatMembershipsTable.memberId, currentUserId),
						),
					);

				await tx
					.insert(chatMessageReadReceiptsTable)
					.values({
						messageId: parsedArgs.input.messageId,
						readerId: currentUserId,
						readAt: new Date(),
					})
					.onConflictDoNothing();
			});

			return true;
		},
	}),
);
