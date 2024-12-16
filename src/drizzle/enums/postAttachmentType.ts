import { z } from "zod";

/**
 * Possible variants of the type of an attachement of a post.
 */
export const postAttachmentTypeEnum = z.enum(["image", "video"]);
