import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const subscriptionChatMessageDeleteInputSchema = z.object({
	id: z.string().uuid(),
});

export const SubscriptionChatMessageDeleteInput = builder
	.inputRef<z.infer<typeof subscriptionChatMessageDeleteInputSchema>>(
		"SubscriptionChatMessageDeleteInput",
	)
	.implement({
		description: "Input for subscribing to chat message delete events.",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the chat to subscribe to.",
				required: true,
			}),
		}),
	});
