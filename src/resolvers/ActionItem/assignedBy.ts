import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const assignedBy: ActionItemResolvers["assignedBy"] = async (parent) => {
  return User.findOne({
    _id: parent.assignedBy,
  }).lean();
};
