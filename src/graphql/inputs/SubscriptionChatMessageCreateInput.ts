import { z } from "zod";
import { chatsTableInsertSchema } from "~/src/drizzle/tables/chats";
import { builder } from "~/src/graphql/builder";

export const subscriptionChatMessageCreateInputSchema = z.object({
	id: chatsTableInsertSchema.shape.id.unwrap(),
});

export const SubscriptionChatMessageCreateInput = builder
	.inputRef<z.infer<typeof subscriptionChatMessageCreateInputSchema>>(
		"SubscriptionChatMessageCreateInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global identifier of the chat.",
				required: true,
			}),
		}),
	});
