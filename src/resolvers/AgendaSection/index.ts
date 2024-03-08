import type { AgendaSectionResolvers } from "../../types/generatedGraphQLTypes";
import { items } from "./items";
import { relatedEvent } from "./relatedEvent";

export const AgendaSection: AgendaSectionResolvers = {
  relatedEvent,
  items,
};
