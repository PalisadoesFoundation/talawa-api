import { z } from "zod";

/**
 * Possible variants of the type of an image.
 */
export const imageMimeTypeEnum = z.enum([
	"image/avif",
	"image/jpeg",
	"image/png",
	"image/webp",
]);
