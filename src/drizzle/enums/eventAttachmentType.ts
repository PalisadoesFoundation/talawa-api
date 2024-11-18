import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of the type of attachements of an event.
 */
export const eventAttachmentTypeEnum = pgEnum("event_attachment_type", [
	"image",
	"video",
]);
