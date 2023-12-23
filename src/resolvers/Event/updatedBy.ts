import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const updatedBy: EventResolvers["updatedBy"] = async (parent) => {
  return User.findOne({
    _id: parent.updatedBy,
  }).lean();
};
