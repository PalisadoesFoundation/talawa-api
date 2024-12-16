import { z } from "zod";

/**
 * Possible variants of the type of an attachement of an advertisement.
 */
export const advertisementAttachmentTypeEnum = z.enum(["image", "video"]);
