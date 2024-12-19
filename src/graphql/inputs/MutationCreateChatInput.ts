import type { z } from "zod";
import { chatsTableInsertSchema } from "~/src/drizzle/tables/chats";
import { builder } from "~/src/graphql/builder";

export const mutationCreateChatInputSchema = chatsTableInsertSchema.pick({
	avatarURI: true,
	description: true,
	name: true,
	organizationId: true,
});

export const MutationCreateChatInput = builder
	.inputRef<z.infer<typeof mutationCreateChatInputSchema>>(
		"MutationCreateChatInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			avatarURI: t.string({
				description: "URI to the avatar of the chat.",
			}),
			description: t.string({
				description: "Custom information about the chat.",
			}),
			name: t.string({
				description: "Name of the chat.",
				required: true,
			}),
			organizationId: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
		}),
	});
