import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of the type of attachements of a post.
 */
export const postAttachmentTypeEnum = pgEnum("post_attachment_type", [
	"image",
	"video",
]);
