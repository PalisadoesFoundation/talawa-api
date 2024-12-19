import type { z } from "zod";
import { chatsTableInsertSchema } from "~/src/drizzle/tables/chats";
import { builder } from "~/src/graphql/builder";

export const mutationUpdateChatInputSchema = chatsTableInsertSchema
	.pick({
		avatarURI: true,
		description: true,
	})
	.extend({
		id: chatsTableInsertSchema.shape.id.unwrap(),
		name: chatsTableInsertSchema.shape.name.optional(),
	})
	.refine(
		({ id, ...arg }) => Object.values(arg).some((value) => value !== undefined),
		{
			message: "At least one optional argument must be provided.",
		},
	);

export const MutationUpdateChatInput = builder
	.inputRef<z.infer<typeof mutationUpdateChatInputSchema>>(
		"MutationUpdateChatInput",
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
			id: t.id({
				description: "Global identifier of the chat.",
				required: true,
			}),
			name: t.string({
				description: "Name of the chat.",
			}),
		}),
	});
