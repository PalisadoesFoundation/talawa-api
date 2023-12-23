import type { EventProjectResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const updatedBy: EventProjectResolvers["updatedBy"] = async (parent) => {
  return User.findOne({
    _id: parent.updatedBy,
  }).lean();
};
