import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const assignedTo: ActionItemResolvers["assignedTo"] = async (parent) => {
  return User.findOne({
    _id: parent.assignedTo,
  }).lean();
};
