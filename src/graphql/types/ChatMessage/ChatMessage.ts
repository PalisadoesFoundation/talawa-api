import type { chatMessagesTable } from "~/src/drizzle/tables/chatMessages";
import { builder } from "~/src/graphql/builder";

export type ChatMessage = typeof chatMessagesTable.$inferSelect;

export const ChatMessage = builder.objectRef<ChatMessage>("ChatMessage");

ChatMessage.implement({
	description:
		"Chat messages are conversations members of a chat have with each other.",
	fields: (t) => ({
		body: t.exposeString("body", {
			description: "Body of the chat message.",
		}),
		createdAt: t.expose("createdAt", {
			description: "Date time at the time the chat message was created.",
			type: "DateTime",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the chat message.",
			nullable: false,
		}),
		updatedAt: t.expose("updatedAt", {
			description: "Date time at the time the chat message was last updated.",
			type: "DateTime",
		}),
	}),
});
