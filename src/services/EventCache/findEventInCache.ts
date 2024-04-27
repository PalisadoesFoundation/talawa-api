import EventCache from "../redisCache";
import type { InterfaceEvent } from "../../models";
import mongoose from "mongoose";
import { logger } from "../../libraries";

export async function findEventsInCache(
  ids: string[],
): Promise<(InterfaceEvent | null)[]> {
  if (ids.length === 0) {
    return [null];
  }

  const keys: string[] = ids.map((id) => {
    return `event:${id}`;
  });

  const eventsFoundInCache = await EventCache.mget(keys);

  const events = eventsFoundInCache.map((event) => {
    if (event === null) {
      return null;
    }

    try {
      const eventObj = JSON.parse(event);

      // Note: While JSON parsing successfully restores the fields, including those with
      // Mongoose Object IDs, these fields are returned as strings due to the serialization
      // process. To ensure accurate data representation, we manually convert these string
      // values back to their original Mongoose Object ID types before delivering them to
      // the requesting resolver.

      return {
        ...eventObj,

        _id: new mongoose.Types.ObjectId(eventObj._id),

        admins:
          eventObj?.admins?.length !== 0
            ? eventObj?.admins?.map((admin: string) => {
                return new mongoose.Types.ObjectId(admin);
              })
            : [],

        organization: new mongoose.Types.ObjectId(eventObj.organization),

        startDate: new Date(eventObj.startDate),

        ...(eventObj?.endDate ? { endDate: new Date(eventObj.endDate) } : {}), // Conditional removal of endDate field

        ...(eventObj?.startTime
          ? { startTime: new Date(eventObj.startTime) }
          : {}), // Conditional removal of startTime field

        ...(eventObj?.endTime ? { endTime: new Date(eventObj.endTime) } : {}), // Conditional removal of endTime field

        creatorId: new mongoose.Types.ObjectId(eventObj.creatorId),

        createdAt: new Date(eventObj.createdAt),

        updatedAt: new Date(eventObj.updatedAt),
      };
    } catch (parseError) {
      logger.info(`Error parsing JSON:${parseError}`);
    }
  });

  return events;
}
