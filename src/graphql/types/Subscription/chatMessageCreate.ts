import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	SubscriptionChatMessageCreateInput,
	subscriptionChatMessageCreateInputSchema,
} from "~/src/graphql/inputs/SubscriptionChatMessageCreateInput";
import { ChatMessage } from "~/src/graphql/types/ChatMessage/ChatMessage";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const subscriptionChatMessageCreateArgumentsSchema = z.object({
	input: subscriptionChatMessageCreateInputSchema,
});

builder.subscriptionField("chatMessageCreate", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: SubscriptionChatMessageCreateInput,
			}),
		},
		description:
			"Subscription field to subscribe to the event of creation of a message in a chat.",
		subscribe: async (_parent, args, ctx) => {
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
			} = subscriptionChatMessageCreateArgumentsSchema.safeParse(args);

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
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.id),
					with: {
						chatMembershipsWhereChat: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
						organization: {
							columns: {},
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
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			return await ctx.pubsub.subscribe(
				`chats.${parsedArgs.input.id}:chat_messages::create`,
			);
		},
		resolve: (parent) => parent,
		type: ChatMessage,
	}),
);
