import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of the type of attachements of an event venue.
 */
export const venueAttachmentTypeEnum = pgEnum("venue_attachment_type", [
	"image",
	"video",
]);
