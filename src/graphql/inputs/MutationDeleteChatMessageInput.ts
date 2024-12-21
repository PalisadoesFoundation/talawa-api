import { z } from "zod";
import { chatMessagesTableInsertSchema } from "~/src/drizzle/tables/chatMessages";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteChatMessageInputSchema = z.object({
	id: chatMessagesTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteChatMessageInput = builder
	.inputRef<z.infer<typeof mutationDeleteChatMessageInputSchema>>(
		"MutationDeleteChatMessageInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the chat message.",
				required: true,
			}),
		}),
	});
