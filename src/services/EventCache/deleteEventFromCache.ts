import EventCache from "../redisCache";
import type { InterfaceEvent } from "../../models";

export async function deleteEventFromCache(
  event: InterfaceEvent
): Promise<void> {
  const key = `event:${event._id}`;

  await EventCache.del(key);

  console.log("Event deleted from cache");
}
