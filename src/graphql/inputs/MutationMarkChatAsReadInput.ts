import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { uuid } from "~/src/graphql/validators/core";

export const mutationMarkChatAsReadInputSchema = z.object({
	chatId: uuid,
	messageId: uuid,
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
