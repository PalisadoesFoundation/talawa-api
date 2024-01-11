import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

export const event: ActionItemResolvers["event"] = async (parent) => {
  return Event.findOne({
    _id: parent.eventId,
  }).lean();
};
