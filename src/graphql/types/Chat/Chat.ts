import type { chatsTable } from "~/src/drizzle/tables/chats";
import { builder } from "~/src/graphql/builder";

export type Chat = typeof chatsTable.$inferSelect;

export const Chat = builder.objectRef<Chat>("Chat");

Chat.implement({
	description: "",
	fields: (t) => ({
		avatarURI: t.exposeString("avatarURI", {
			description: "URI to the avatar of the chat.",
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
	}),
});
