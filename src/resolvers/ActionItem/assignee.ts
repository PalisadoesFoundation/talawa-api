import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const assignee: ActionItemResolvers["assignee"] = async (parent) => {
  return User.findOne({
    _id: parent.assigneeId,
  }).lean();
};
