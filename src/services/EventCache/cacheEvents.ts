import { logger } from "../../libraries";
import type { InterfaceEvent } from "../../models";
import EventCache from "../redisCache";

// Function to store events in the cache using pipelining
export async function cacheEvents(events: InterfaceEvent[]): Promise<void> {
  try {
    const pipeline = EventCache.pipeline();

    events.forEach((event) => {
      if (event !== null) {
        const key = `event:${event._id}`;
        pipeline.set(key, JSON.stringify(event));
        // SET the time to live for each of the organization in the cache to 300s.
        pipeline.expire(key, 300);
      }
    });

    // Execute the pipeline
    await pipeline.exec();
  } catch (error) {
    logger.info(error);
  }
}
