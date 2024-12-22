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
			parentChatMessageId:
				chatMessagesTableInsertSchema.shape.parentChatMessageId
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
			parentChatMessageId: t.id({
				description: "Global identifier of the associated parent chat message.",
				required: true,
			}),
		}),
	});
