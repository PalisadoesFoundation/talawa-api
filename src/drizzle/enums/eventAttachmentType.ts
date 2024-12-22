import { z } from "zod";

/**
 * Possible variants of the type of an attachement of an event.
 */
export const eventAttachmentTypeEnum = z.enum(["image", "video"]);
