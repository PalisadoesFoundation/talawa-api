import { z } from "zod";

/**
 * Possible variants of the type of a vote on a post.
 */
export const postVoteTypeValues = ["down_vote", "up_vote"] as const;

export const postVoteTypeZodEnum = z.enum(postVoteTypeValues);
