import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { assignee } from "./assignee";
import { assigner } from "./assigner";
import { actionItemCategory } from "./actionItemCategory";
import { event } from "./event";
import { creator } from "./creator";

export const ActionItem: ActionItemResolvers = {
  assignee,
  assigner,
  actionItemCategory,
  event,
  creator,
};
