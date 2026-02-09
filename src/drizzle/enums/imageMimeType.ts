import { z } from "zod";

/**
 * Possible variants of the type of an image.
 */
export const imageMimeTypes = [
	"image/avif",
	"image/jpeg",
	"image/png",
	"image/webp",
] as const;

export const imageMimeTypeEnum = z.enum(imageMimeTypes);
