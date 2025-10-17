import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const mutationMarkChatAsReadInputSchema = z.object({
	chatId: z.string().uuid(),
	messageId: z.string().uuid(),
});

export const MutationMarkChatAsReadInput = builder
	.inputRef<z.infer<typeof mutationMarkChatAsReadInputSchema>>(
		"MutationMarkChatAsReadInput",
	)
	.implement({
		description:
			"Input for marking messages in a chat as read up to a specific message.",
		fields: (t) => ({
			chatId: t.field({
				type: "ID",
				required: true,
				description: "The ID of the chat to mark messages as read in.",
			}),
			messageId: t.field({
				type: "ID",
				required: true,
				description: "The ID of the message to mark as read.",
			}),
		}),
	});
