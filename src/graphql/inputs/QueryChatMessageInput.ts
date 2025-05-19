import { z } from "zod";
import { chatMessagesTableInsertSchema } from "~/src/drizzle/tables/chatMessages";
import { builder } from "~/src/graphql/builder";

export const queryChatMessageInputSchema = z.object({
	id: chatMessagesTableInsertSchema.shape.id.unwrap(),
});

export const QueryChatMessageInput = builder
	.inputRef<z.infer<typeof queryChatMessageInputSchema>>(
		"QueryChatMessageInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the chat message.",
				required: true,
			}),
		}),
	});
