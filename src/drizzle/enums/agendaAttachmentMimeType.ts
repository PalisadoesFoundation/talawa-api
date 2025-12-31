import { z } from "zod";

export const mimeTypeMapping = {
    IMAGE_AVIF: "image/avif",
    IMAGE_JPEG: "image/jpeg",
    IMAGE_PNG: "image/png",
    IMAGE_WEBP: "image/webp",
    VIDEO_MP4: "video/mp4",
    VIDEO_WEBM: "video/webm",
} as const;

export const agendaAttachmentMimeTypeEnum = z.enum([
    "image/avif",
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
]);
