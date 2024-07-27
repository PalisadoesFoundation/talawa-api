import { logger } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import EventCache from "../redisCache";

/**
 * Stores events in Redis cache with a specified time-to-live (TTL).
 * @param events - Array of events to be cached.
 * @returns Promise<void>
 */
export async function cacheEvents(events: InterfaceEvent[]): Promise<void> {
  try {
    // Create a pipeline for efficient Redis operations
    const pipeline = EventCache.pipeline();

    events.forEach((event) => {
      if (event !== null) {
        // Generate key for each event based on its ID
        const key = `event:${event._id}`;

        // Store event data as JSON string in Redis
        pipeline.set(key, JSON.stringify(event));

        // Set TTL for each event to 300 seconds (5 minutes)
        pipeline.expire(key, 300);
      }
    });

    // Execute the pipeline for batch Redis operations
    await pipeline.exec();
  } catch (error) {
    // Log any errors that occur during caching
    logger.info(error);
  }
}
