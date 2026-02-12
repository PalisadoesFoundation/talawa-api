import { z } from "zod";
import { postAttachmentMimeTypeZodEnum } from "~/src/drizzle/enums/postAttachmentMimeType";
import { builder } from "~/src/graphql/builder";
import { PostAttachmentMimeType } from "~/src/graphql/enums/PostAttachmentMimeType";

/**
 * Zod schema for validating file metadata input submitted after MinIO presigned URL upload.
 */
export const fileMetadataInputSchema = z.object({
	/**
	 * SHA-256 hash of the file (64-character hex string) for integrity verification.
	 * Note: This is used for file integrity checks, not database-enforced deduplication.
	 */
	fileHash: z
		.string()
		.regex(
			/^[a-f0-9]{64}$/,
			"Must be a valid SHA-256 hash (64 lowercase hexadecimal characters)",
		),
	/**
	 * MIME type of the uploaded file.
	 */
	mimeType: postAttachmentMimeTypeZodEnum,
	/**
	 * Original file name for display purposes.
	 */
	name: z.string().min(1),
	/**
	 * MinIO object name returned from createPresignedUrl mutation.
	 */
	objectName: z.string().min(1),
});

export type FileMetadataInputType = z.infer<typeof fileMetadataInputSchema>;

/**
 * GraphQL input type for file metadata submitted after MinIO presigned URL upload.
 */
export const FileMetadataInput = builder
	.inputRef<FileMetadataInputType>("FileMetadataInput")
	.implement({
		description: "Metadata for files uploaded via presigned URL",
		fields: (t) => ({
			fileHash: t.string({
				description:
					"SHA-256 hash for integrity verification (not DB-enforced deduplication)",
				required: true,
			}),
			mimeType: t.field({
				description: "MIME type of the file",
				required: true,
				type: PostAttachmentMimeType,
			}),
			name: t.string({
				description: "Name of the file",
				required: true,
			}),
			objectName: t.string({
				description: "Object name used in storage",
				required: true,
			}),
		}),
	});
