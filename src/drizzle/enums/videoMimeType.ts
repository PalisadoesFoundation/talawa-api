import { z } from "zod";

/**
 * Possible variants of the type of a video.
 */
export const videoMimeTypeEnum = z.enum(["video/mp4", "video/webm"]);
