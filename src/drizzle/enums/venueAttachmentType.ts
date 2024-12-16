import { z } from "zod";

/**
 * Possible variants of the type of an attachement of an event venue.
 */
export const venueAttachmentTypeEnum = z.enum(["image", "video"]);
