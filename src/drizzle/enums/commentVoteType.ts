import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of the type of votes on a comment.
 */
export const commmentVoteTypeEnum = pgEnum("comment_vote_type", [
	"down_vote",
	"up_vote",
]);
