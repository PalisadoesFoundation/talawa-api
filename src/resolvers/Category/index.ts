import type { CategoryResolvers } from "../../types/generatedGraphQLTypes";
import { org } from "./org";
import { createdBy } from "./createdBy";

export const Category: CategoryResolvers = {
  org,
  createdBy,
};
