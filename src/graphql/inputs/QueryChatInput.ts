import { z } from "zod";
import { chatsTableInsertSchema } from "~/src/drizzle/tables/chats";
import { builder } from "~/src/graphql/builder";

export const queryChatInputSchema = z.object({
	id: chatsTableInsertSchema.shape.id.unwrap(),
});

export const QueryChatInput = builder
	.inputRef<z.infer<typeof queryChatInputSchema>>("QueryChatInput")
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the chat.",
				required: true,
			}),
		}),
	});
