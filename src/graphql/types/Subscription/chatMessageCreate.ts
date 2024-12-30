import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import {
	SubscriptionChatMessageCreateInput,
	subscriptionChatMessageCreateInputSchema,
} from "~/src/graphql/inputs/SubscriptionChatMessageCreateInput";
import { ChatMessage } from "~/src/graphql/types/ChatMessage/ChatMessage";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

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
			"Subscription field to subscribe to the event of creation of a chat message.",
		subscribe: async (_parent, args, ctx) => {
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
					message: "Invalid arguments provided.",
				});
			}

			const existingChat = await ctx.drizzleClient.query.chatsTable.findFirst({
				columns: {
					avatarMimeType: true,
				},
				where: (fields, operators) =>
					operators.eq(fields.id, parsedArgs.input.id),
			});

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
					message: "No associated resources found for the provided arguments.",
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
