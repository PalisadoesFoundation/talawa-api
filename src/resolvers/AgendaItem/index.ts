import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { organization } from "./organization";
import { createdBy } from "./createdBy";
import { updatedBy } from "./updatedBy";
import { relatedEvent } from "./relatedEvent";
import { categories } from "./categories";

export const AgendaItem: AgendaItemResolvers = {
  organization,
  createdBy,
  updatedBy,
  relatedEvent,
  categories,
};
