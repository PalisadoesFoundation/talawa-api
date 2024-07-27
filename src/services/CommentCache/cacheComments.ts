import { logger } from "../../libraries";
import type { InterfaceComment } from "../../models";
import CommentCache from "../redisCache";

/**
 * Stores comments in Redis cache with a specified time-to-live (TTL).
 * @param comments - Array of comments to be cached.
 * @returns Promise<void>
 */
export async function cacheComments(
  comments: InterfaceComment[],
): Promise<void> {
  try {
    // Create a pipeline for efficient Redis operations
    const pipeline = CommentCache.pipeline();

    comments.forEach((comment) => {
      if (comment !== null) {
        // Generate key for each comment based on its ID
        const key = `comment:${comment._id}`;

        // Generate key for indexing comments by postId
        const postID = `post_comments:${comment.postId}`;

        // Store comment data as JSON string in Redis
        pipeline.set(key, JSON.stringify(comment));

        // Index comment based on its postId
        pipeline.hset(postID, key, "null");

        // Set TTL for each comment and its postId index to 300 seconds (5 minutes)
        pipeline.expire(key, 300);
        pipeline.expire(postID, 300);
      }
    });

    // Execute the pipeline for batch Redis operations
    await pipeline.exec();
  } catch (error) {
    // Log any errors that occur during caching
    logger.info(error);
  }
}
