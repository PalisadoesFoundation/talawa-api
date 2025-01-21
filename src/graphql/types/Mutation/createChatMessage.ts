import { z } from "zod";
import { chatMessagesTable } from "~/src/drizzle/tables/chatMessages";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateChatMessageInput,
	mutationCreateChatMessageInputSchema,
} from "~/src/graphql/inputs/MutationCreateChatMessageInput";
import { ChatMessage } from "~/src/graphql/types/ChatMessage/ChatMessage";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateChatMessageArgumentsSchema = z.object({
	input: mutationCreateChatMessageInputSchema,
});

builder.mutationField("createChatMessage", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateChatMessageInput,
			}),
		},
		description: "Mutation field to create a chat message.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				success,
				data: parsedArgs,
				error,
			} = mutationCreateChatMessageArgumentsSchema.safeParse(args);

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

			const [currentUser, existingChat] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.chatsTable.findFirst({
					columns: {
						avatarMimeType: true,
					},
					with: {
						chatMembershipsWhereChat: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
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
						operators.eq(fields.id, parsedArgs.input.chatId),
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
								argumentPath: ["input", "chatId"],
							},
						],
					},
				});
			}

			if (parsedArgs.input.parentMessageId !== undefined) {
				const parentMessageId = parsedArgs.input.parentMessageId;

				const existingChatMessage =
					await ctx.drizzleClient.query.chatMessagesTable.findFirst({
						columns: {
							updatedAt: true,
						},
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.chatId, parsedArgs.input.chatId),
								operators.eq(fields.id, parentMessageId),
							),
					});

				if (existingChatMessage === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "parentMessageId"],
								},
							],
						},
					});
				}
			}

			const currentUserOrganizationMembership =
				existingChat.organization.membershipsWhereOrganization[0];
			const currentUserChatMembership =
				existingChat.chatMembershipsWhereChat[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					(currentUserOrganizationMembership.role !== "administrator" &&
						currentUserChatMembership === undefined))
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "chatId"],
							},
						],
					},
				});
			}

			const [createdChatMessage] = await ctx.drizzleClient
				.insert(chatMessagesTable)
				.values({
					body: parsedArgs.input.body,
					chatId: parsedArgs.input.chatId,
					creatorId: currentUserId,
					parentMessageId: parsedArgs.input.parentMessageId,
				})
				.returning();

			// Inserted chat message not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdChatMessage === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			ctx.pubsub.publish({
				payload: createdChatMessage,
				topic: `chats.${parsedArgs.input.chatId}:chat_messages::create`,
			});

			return createdChatMessage;
		},
		type: ChatMessage,
	}),
);
