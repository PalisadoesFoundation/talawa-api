import { builder } from "~/src/graphql/builder";

/**
 * Mapping of valid GraphQL enum names to actual MIME type strings.
 * GraphQL enum values cannot contain special characters like '/'.
 */
export const PostAttachmentMimeType = builder.enumType(
	"PostAttachmentMimeType",
	{
		description: "Possible MIME types for post/agenda item attachments.",
		values: {
			IMAGE_AVIF: { value: "image/avif" },
			IMAGE_JPEG: { value: "image/jpeg" },
			IMAGE_PNG: { value: "image/png" },
			IMAGE_WEBP: { value: "image/webp" },
			VIDEO_MP4: { value: "video/mp4" },
			VIDEO_WEBM: { value: "video/webm" },
			VIDEO_QUICKTIME: { value: "video/quicktime" },
		},
	},
);
