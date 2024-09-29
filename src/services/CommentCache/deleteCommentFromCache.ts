import CommentCache from "../redisCache";
import type { InterfaceComment } from "../../models";

/**
 * Deletes the specified comment from Redis cache.
 *
 * @param comment - The InterfaceComment object representing the comment to delete.
 * @returns A promise resolving to void.
 */
export async function deleteCommentFromCache(
  comment: InterfaceComment,
): Promise<void> {
  // Generate the cache key for the comment based on its _id
  const key = `comment:${comment._id}`;

  // Delete the comment from Redis cache
  await CommentCache.del(key);
}
