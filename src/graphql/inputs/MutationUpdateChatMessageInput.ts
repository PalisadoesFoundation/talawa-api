import type { z } from "zod";
import { chatMessagesTableInsertSchema } from "~/src/drizzle/tables/chatMessages";
import { builder } from "~/src/graphql/builder";
import { sanitizedStringSchema } from "~/src/utilities/sanitizer";

export const mutationUpdateChatMessageInputSchema =
	chatMessagesTableInsertSchema.pick({}).extend({
		body: sanitizedStringSchema,
		id: chatMessagesTableInsertSchema.shape.id.unwrap(),
	});

export const MutationUpdateChatMessageInput = builder
	.inputRef<z.infer<typeof mutationUpdateChatMessageInputSchema>>(
		"MutationUpdateChatMessageInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			body: t.string({
				description: "Body of the chat message.",
				required: true,
			}),
			id: t.id({
				description: "Global identifier of the chat message.",
				required: true,
			}),
		}),
	});
