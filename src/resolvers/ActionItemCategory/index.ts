import type { ActionItemCategoryResolvers } from "../../types/generatedGraphQLTypes";
import { organization } from "./organization";
import { creator } from "./creator";

export const ActionItemCategory: ActionItemCategoryResolvers = {
  organization,
  creator,
};
