import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { chatsTableInsertSchema } from "~/src/drizzle/tables/chats";
import { builder } from "~/src/graphql/builder";
import { ChatType } from "~/src/graphql/enums/ChatType";

export const mutationCreateChatInputSchema = chatsTableInsertSchema
	.pick({
		description: true,
		name: true,
		organizationId: true,
		type: true,
	})
	.extend({
		avatar: z.custom<Promise<FileUpload>>().nullish(),
		participants: z.array(z.string()).optional(),
	});

export const MutationCreateChatInput = builder
	.inputRef<z.infer<typeof mutationCreateChatInputSchema>>(
		"MutationCreateChatInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			avatar: t.field({
				description: "Avatar of the chat.",
				type: "Upload",
			}),
			participants: t.field({
				description:
					"Participant ids for a direct chat (required for direct chats, optional for group chats).",
				type: t.listRef("ID", { required: true }),
				required: false,
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
			type: t.field({
				description: "Type of the chat (direct or group).",
				type: ChatType,
				required: true,
			}),
		}),
	});
