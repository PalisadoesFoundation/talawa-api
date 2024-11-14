import { logger } from "../../libraries";
import type { InterfaceUser } from "../../models";
import UserCache from "../redisCache";

/**
 * Caches the provided array of InterfaceUser objects in Redis.
 *
 * @param users - An array of InterfaceUser objects to be cached.
 * @returns A promise resolving to void.
 */
export async function cacheUsers(users: InterfaceUser[]): Promise<void> {
  try {
    // Create a Redis pipeline for efficient multi-command execution
    const pipeline = UserCache.pipeline();

    // Iterate through each user in the array
    users.forEach((user) => {
      if (user !== null) {
        // Generate the cache key for each user
        const key = `user:${user._id}`;

        // Store the user object as a JSON string in Redis
        pipeline.set(key, JSON.stringify(user));

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
