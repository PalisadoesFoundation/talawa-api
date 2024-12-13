import { z } from "zod";

/**
 * Possible variants of the type of of a vote on a comment.
 */
export const commentVoteTypeEnum = z.enum(["down_vote", "up_vote"]);
