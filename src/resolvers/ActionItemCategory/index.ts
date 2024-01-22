import type { ActionItemCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { org } from "./org";
import { createdBy } from "./createdBy";

export const ActionItemCategory: ActionItemCategoryResolvers = {
  org,
  createdBy,
};
