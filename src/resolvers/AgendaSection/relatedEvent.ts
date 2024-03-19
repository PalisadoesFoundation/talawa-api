import type { AgendaSectionResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

export const relatedEvent: AgendaSectionResolvers["relatedEvent"] = async (
  parent,
) => {
  return Event.findOne(parent.relatedEvent).lean();
};
