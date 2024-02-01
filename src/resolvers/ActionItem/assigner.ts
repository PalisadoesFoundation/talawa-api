import type { ActionItemResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const assigner: ActionItemResolvers["assigner"] = async (parent) => {
  return User.findOne({
    _id: parent.assignerId,
  }).lean();
};
