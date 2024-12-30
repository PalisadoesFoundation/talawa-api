import { Chat } from "./Chat";

Chat.implement({
	fields: (t) => ({
		avatarURL: t.field({
			description: "URL to the avatar of the chat.",
			resolve: async (parent, _args, ctx) =>
				new URL(
					`/objects/${parent.name}`,
					ctx.envConfig.API_BASE_URL,
				).toString(),
			type: "String",
		}),
	}),
});
