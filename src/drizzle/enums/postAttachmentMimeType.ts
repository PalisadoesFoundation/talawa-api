import { z } from "zod";

export const postAttachmentTypes = [
	"image/avif",
	"image/jpeg",
	"image/png",
	"image/webp",
	"video/mp4",
	"video/webm",
	"video/quicktime",
] as const;

export const postAttachmentMimeTypeZodEnum = z.enum(postAttachmentTypes);
