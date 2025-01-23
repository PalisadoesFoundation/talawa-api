import { Chat } from "./Chat";

Chat.implement({
	fields: (t) => ({
		avatarURL: t.field({
			description: "URL to the avatar of the chat.",
			resolve: async (parent, _args, ctx) =>
				parent.avatarName === null
					? null
					: new URL(
							`/objects/${parent.avatarName}`,
							ctx.envConfig.API_BASE_URL,
						).toString(),
			type: "String",
		}),
	}),
});
