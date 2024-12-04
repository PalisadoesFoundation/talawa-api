import type { z } from "zod";
import { postAttachmentsTableInsertSchema } from "~/src/drizzle/tables/postAttachments";
import { builder } from "~/src/graphql/builder";
import { PostAttachmentType } from "~/src/graphql/enums/PostAttachmentType";

export const createPostAttachmentInputSchema =
	postAttachmentsTableInsertSchema.pick({
		uri: true,
		type: true,
	});

export const CreatePostAttachmentInput = builder
	.inputRef<z.infer<typeof createPostAttachmentInputSchema>>(
		"PostAttachmentInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			uri: t.string({
				description: "URI to the attachment.",
				required: true,
			}),
			type: t.field({
				description: "Type of the attachment.",
				required: true,
				type: PostAttachmentType,
			}),
		}),
	});
