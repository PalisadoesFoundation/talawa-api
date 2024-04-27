import type { AgendaItemResolvers } from "../../types/generatedGraphQLTypes";
import { organization } from "./organization";
import { createdBy } from "./createdBy";
import { updatedBy } from "./updatedBy";
import { relatedEvent } from "./relatedEvent";
import { categories } from "./categories";
import { users } from "./Users";

export const AgendaItem: AgendaItemResolvers = {
  organization,
  createdBy,
  updatedBy,
  relatedEvent,
  categories,
  users,
};
