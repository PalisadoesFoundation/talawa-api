import { z } from "zod";
import { chatMessagesTable } from "~/src/drizzle/tables/chatMessages";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateChatMessageInput,
	mutationCreateChatMessageInputSchema,
} from "~/src/graphql/inputs/MutationCreateChatMessageInput";
import { ChatMessage } from "~/src/graphql/types/ChatMessage/ChatMessage";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

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
					message: "Only authenticated users can perform this action.",
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
					message: "Invalid arguments provided.",
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
								organizationMembershipsWhereOrganization: {
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
					message: "Only authenticated users can perform this action.",
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
					message: "No associated resources found for the provided arguments.",
				});
			}

			if (parsedArgs.input.parentChatMessageId !== undefined) {
				const parentChatMessageId = parsedArgs.input.parentChatMessageId;

				const existingChatMessage =
					await ctx.drizzleClient.query.chatMessagesTable.findFirst({
						columns: {
							updatedAt: true,
						},
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.chatId, parsedArgs.input.chatId),
								operators.eq(fields.id, parentChatMessageId),
							),
					});

				if (existingChatMessage === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "parentChatMessageId"],
								},
							],
						},
						message:
							"No associated resources found for the provided arguments.",
					});
				}
			}

			const currentUserOrganizationMembership =
				existingChat.organization.organizationMembershipsWhereOrganization[0];
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
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [createdChatMessage] = await ctx.drizzleClient
				.insert(chatMessagesTable)
				.values({
					body: parsedArgs.input.body,
					chatId: parsedArgs.input.chatId,
					creatorId: currentUserId,
					parentChatMessageId: parsedArgs.input.parentChatMessageId,
				})
				.returning();

			// Inserted chat message not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdChatMessage === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
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
