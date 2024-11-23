import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of the type of attachements of an advertisement.
 */
export const advertisementAttachmentTypeEnum = pgEnum(
	"advertisement_attachment_type",
	["image", "video"],
);
