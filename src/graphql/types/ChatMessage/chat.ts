import { Chat } from "~/src/graphql/types/Chat/Chat";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ChatMessage } from "./ChatMessage";

ChatMessage.implement({
	fields: (t) => ({
		chat: t.field({
			description: "Chat which the chat message belongs to.",
			resolve: async (parent, _args, ctx) => {
				const existingChat = await ctx.drizzleClient.query.chatsTable.findFirst(
					{
						where: (fields, operators) =>
							operators.eq(fields.id, parent.chatId),
					},
				);

				// Chat id existing but the associated chat not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingChat === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a chat message's chat id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingChat;
			},
			type: Chat,
		}),
	}),
});
