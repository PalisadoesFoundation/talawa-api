import { z } from "zod";
import {
	mimeTypeMapping,
	postAttachmentMimeTypeEnum,
} from "~/src/drizzle/enums/postAttachmentMimeType";
import { postsTableInsertSchema } from "~/src/drizzle/tables/posts";
import { builder } from "~/src/graphql/builder";
import { escapeHTML, sanitizedStringSchema } from "~/src/utilities/sanitizer";

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
	objectName: z.string().min(1).transform(escapeHTML),
	fileHash: z.string().min(1),
	name: z.string().min(1).transform(escapeHTML),
});

export const mutationCreatePostInputSchema = postsTableInsertSchema
	.pick({
		organizationId: true,
	})
	.extend({
		caption: sanitizedStringSchema,
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
