import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { assignedTo } from "./assignedTo";
import { assignedBy } from "./assignedBy";
import { category } from "./category";
import { event } from "./event";
import { createdBy } from "./createdBy";
import { updatedBy } from "./updatedBy";

export const ActionItem: ActionItemResolvers = {
  assignedTo,
  assignedBy,
  category,
  event,
  createdBy,
  updatedBy,
};
