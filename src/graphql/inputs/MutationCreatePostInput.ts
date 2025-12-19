import { z } from "zod";
import {
	mimeTypeMapping,
	postAttachmentMimeTypeEnum,
} from "~/src/drizzle/enums/postAttachmentMimeType";
import {
	POST_BODY_MAX_LENGTH,
	POST_CAPTION_MAX_LENGTH,
	postsTableInsertSchema,
} from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";

export const PostAttachmentMimeType = builder.enumType(
	"PostAttachmentMimeType",
	{
		values: Object.fromEntries(
			Object.entries(mimeTypeMapping).map(([key, value]) => [key, { value }]),
		),
		description: "MIME types supported for post attachments",
	},
);

export const FileMetadataInput = builder.inputType("FileMetadataInput", {
	description: "Metadata for files uploaded via presigned URL",
	fields: (t) => ({
		mimetype: t.field({
			description: "MIME type of the file",
			type: PostAttachmentMimeType,
			required: true,
		}),
		objectName: t.string({
			description: "Object name used in storage",
			required: true,
		}),
		name: t.string({
			description: "Name of the file",
			required: true,
		}),
		fileHash: t.string({
			description: "Hash of the file for deduplication",
			required: true,
		}),
	}),
});

export const fileMetadataSchema = z.object({
	mimetype: postAttachmentMimeTypeEnum,
	objectName: z.string().min(1),
	fileHash: z.string().min(1),
	name: z.string().min(1),
});

export const mutationCreatePostInputSchema = postsTableInsertSchema
	.pick({
		organizationId: true,
	})
	.extend({
		/**
		 * Caption of the post.
		 * We persist the raw (trimmed) text and perform HTML escaping at output time
		 * to avoid double-escaping and exceeding DB length limits with escaped entities.
		 */
		caption: z
			.string()
			.trim()
			.min(1)
			.max(POST_CAPTION_MAX_LENGTH, {
				message: `Post caption must not exceed ${POST_CAPTION_MAX_LENGTH} characters.`,
			}),
		/**
		 * Body of the post.
		 * We persist the raw (trimmed) text and perform HTML escaping at output time
		 * to avoid double-escaping and exceeding DB length limits with escaped entities.
		 */
		body: z
			.string()
			.trim()
			.min(1)
			.max(POST_BODY_MAX_LENGTH, {
				message: `Post body must not exceed ${POST_BODY_MAX_LENGTH} characters.`,
			})
			.optional(),
		attachments: z.array(fileMetadataSchema).max(20).optional(),
		isPinned: z.boolean().optional(),
	});

export const MutationCreatePostInput = builder.inputType(
	"MutationCreatePostInput",
	{
		description: "Input for creating a new post",
		fields: (t) => ({
			attachments: t.field({
				description: "Metadata for files already uploaded via presigned URL",
				type: [FileMetadataInput],
				required: false,
			}),
			caption: t.string({
				description: "Caption about the post.",
				required: true,
			}),
			body: t.string({
				description: "Body content of the post.",
				required: false,
			}),
			isPinned: t.boolean({
				description: "Boolean to tell if the post is pinned",
			}),
			organizationId: t.id({
				description:
					"Global identifier of the associated organization in which the post is posted.",
				required: true,
			}),
		}),
	},
);
