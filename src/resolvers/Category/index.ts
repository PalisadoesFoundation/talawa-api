import type { CategoryResolvers } from "../../types/generatedGraphQLTypes";
import { org } from "./org";
import { createdBy } from "./createdBy";
import { updatedBy } from "./updatedBy";

export const Category: CategoryResolvers = {
  org,
  createdBy,
  updatedBy,
};
