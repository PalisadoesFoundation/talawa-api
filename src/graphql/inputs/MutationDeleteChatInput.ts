import { z } from "zod";
import { chatsTableInsertSchema } from "~/src/drizzle/tables/chats";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteChatInputSchema = z.object({
	id: chatsTableInsertSchema.shape.id.unwrap(),
});

export const MutationDeleteChatInput = builder
	.inputRef<z.infer<typeof mutationDeleteChatInputSchema>>(
		"MutationDeleteChatInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			id: t.id({
				description: "Global identifier of the chat.",
				required: true,
			}),
		}),
	});
