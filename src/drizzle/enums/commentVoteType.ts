import { z } from "zod";

/**
 * Possible variants of the type of of a vote on a comment.
 */
export const commentVoteTypeValues = ["down_vote", "up_vote"] as const;

export const commentVoteTypeZodEnum = z.enum(commentVoteTypeValues);
