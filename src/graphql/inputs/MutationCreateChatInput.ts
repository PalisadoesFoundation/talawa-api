import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { chatsTableInsertSchema } from "~/src/drizzle/tables/chats";
import { builder } from "~/src/graphql/builder";

export const mutationCreateChatInputSchema = chatsTableInsertSchema
	.pick({
		description: true,
		name: true,
		organizationId: true,
	})
	.extend({
		avatar: z.custom<Promise<FileUpload>>().nullish(),
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
