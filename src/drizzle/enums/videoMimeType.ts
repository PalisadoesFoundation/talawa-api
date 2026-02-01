import { z } from "zod";

/**
 * Possible variants of the type of a video.
 */

export const videoMimeTypes = ["video/mp4", "video/webm"] as const;

export const videoMimeTypeEnum = z.enum(videoMimeTypes);
