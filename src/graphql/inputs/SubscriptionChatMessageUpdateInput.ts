import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const subscriptionChatMessageUpdateInputSchema = z.object({
	id: z.string().uuid(),
});

export const SubscriptionChatMessageUpdateInput = builder
	.inputRef<z.infer<typeof subscriptionChatMessageUpdateInputSchema>>(
		"SubscriptionChatMessageUpdateInput",
	)
	.implement({
		description: "Input for subscribing to chat message update events.",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the chat to subscribe to.",
				required: true,
			}),
		}),
	});
