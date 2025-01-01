import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ChatMessage } from "./ChatMessage";

ChatMessage.implement({
	fields: (t) => ({
		parentChatMessage: t.field({
			description: "Parent chat message of the chat message.",
			resolve: async (parent, _args, ctx) => {
				if (parent.parentChatMessageId === null) {
					return null;
				}

				const parentChatMessageId = parent.parentChatMessageId;

				const existingChatMessage =
					await ctx.drizzleClient.query.chatMessagesTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parentChatMessageId),
					});

				// Parent chat message id existing but the associated chat message not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingChatMessage === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a chat message's parent chat message id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingChatMessage;
			},
			type: ChatMessage,
		}),
	}),
});
