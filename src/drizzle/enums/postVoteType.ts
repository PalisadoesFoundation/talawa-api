import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of the type of votes on a post.
 */
export const postVoteTypeEnum = pgEnum("post_vote_type", [
	"down_vote",
	"up_vote",
]);
