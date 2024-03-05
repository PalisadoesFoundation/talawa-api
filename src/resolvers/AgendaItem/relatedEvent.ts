import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { Event } from "../../models";

export const relatedEvent: AgendaItemResolvers["relatedEvent"] = async (
  parent,
) => {
  return Event.findOne(parent.relatedEvent).lean();
};
