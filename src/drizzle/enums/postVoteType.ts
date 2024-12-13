import { z } from "zod";

/**
 * Possible variants of the type of a vote on a post.
 */
export const postVoteTypeEnum = z.enum(["down_vote", "up_vote"]);
