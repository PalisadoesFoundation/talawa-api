import type { AgendaCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { organization } from "./organization";
import { createdBy } from "./createdBy";

export const ActionItemCategory: AgendaCategoryResolvers = {
  organization,
  createdBy,
};
