import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

export const baseRecurringEvent: EventResolvers["baseRecurringEvent"] = async (
  parent,
) => {
  return await Event.findOne({
    _id: parent.baseRecurringEventId,
  }).lean();
};
