import type { z } from "zod";
import { chatMessagesTableInsertSchema } from "~/src/drizzle/tables/chatMessages";
import { builder } from "~/src/graphql/builder";

export const mutationCreateChatMessageInputSchema =
	chatMessagesTableInsertSchema
		.pick({
			body: true,
			chatId: true,
		})
		.extend({
			parentMessageId: chatMessagesTableInsertSchema.shape.parentMessageId
				.unwrap()
				.unwrap()
				.optional(),
		});

export const MutationCreateChatMessageInput = builder
	.inputRef<z.infer<typeof mutationCreateChatMessageInputSchema>>(
		"MutationCreateChatMessageInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			body: t.string({
				description: "Body of the chat message.",
				required: true,
			}),
			chatId: t.id({
				description: "Global identifier of the associated chat.",
				required: true,
			}),
			parentMessageId: t.id({
				description: "Global identifier of the associated parent message.",
				required: true,
			}),
		}),
	});
