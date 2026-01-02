import { z } from "zod";

export const agendaAttachmentMimeTypeEnum = z.enum([
	"image/avif",
	"image/jpeg",
	"image/png",
	"image/webp",
	"video/mp4",
	"video/webm",
]);
