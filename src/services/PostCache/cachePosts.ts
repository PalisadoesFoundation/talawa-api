import { logger } from "../../libraries";
import type { InterfacePost } from "../../models";
import PostCache from "../redisCache";

/**
 * Caches the provided array of InterfacePost objects in Redis.
 *
 * @param posts - An array of InterfacePost objects to be cached.
 * @returns A promise resolving to void.
 */
export async function cachePosts(posts: InterfacePost[]): Promise<void> {
  try {
    // Create a Redis pipeline for efficient multi-command execution
    const pipeline = PostCache.pipeline();

    // Iterate through each post in the array
    posts.forEach((post) => {
      if (post !== null) {
        // Generate the cache key for each post
        const key = `post:${post._id}`;

        // Store the post object as a JSON string in Redis
        pipeline.set(key, JSON.stringify(post));

        // Set an expiration time for the cache key (in seconds)
        pipeline.expire(key, 300); // 300 seconds (5 minutes) expiration
      }
    });

    // Execute the Redis pipeline
    await pipeline.exec();
  } catch (error) {
    // Log any errors that occur during caching
    logger.info(error);
  }
}
