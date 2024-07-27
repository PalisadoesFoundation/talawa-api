import EventCache from "../redisCache";
import type { Types } from "mongoose";

/**
 * Deletes the specified event from Redis cache.
 *
 * @param eventId - The ObjectId representing the event to delete from cache.
 * @returns A promise resolving to void.
 */
export async function deleteEventFromCache(
  eventId: Types.ObjectId,
): Promise<void> {
  // Generate the cache key for the event based on its eventId
  const key = `event:${eventId}`;

  // Delete the event from Redis cache
  await EventCache.del(key);
}
