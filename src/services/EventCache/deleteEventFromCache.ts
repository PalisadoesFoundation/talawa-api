import EventCache from "../redisCache";
import type { Types } from "mongoose";

export async function deleteEventFromCache(
  eventId: Types.ObjectId
): Promise<void> {
  const key = `event:${eventId}`;

  await EventCache.del(key);
}
