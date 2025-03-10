import { z } from "zod";

// Define a mapping between valid GraphQL enum names and actual MIME types
export const mimeTypeMapping = {
  IMAGE_AVIF: "image/avif",
  IMAGE_JPEG: "image/jpeg",
  IMAGE_PNG: "image/png",
  IMAGE_WEBP: "image/webp",
  VIDEO_MP4: "video/mp4",
  VIDEO_WEBM: "video/webm"
};

// For database use
export const postAttachmentMimeTypeEnum = z.enum([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm"
]);

// For GraphQL schema
export const graphqlMimeTypeEnum = Object.keys(mimeTypeMapping);