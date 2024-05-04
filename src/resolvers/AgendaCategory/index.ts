import type { AgendaCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { organization } from "./organization";
import { createdBy } from "./createdBy";
import { updatedBy } from "./updatedBy";

export const AgendaCategory: AgendaCategoryResolvers = {
  organization,
  createdBy,
  updatedBy,
};
