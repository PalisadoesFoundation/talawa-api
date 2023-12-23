import type { EventProjectResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const createdBy: EventProjectResolvers["createdBy"] = async (parent) => {
  return User.findOne({
    _id: parent.createdBy,
  }).lean();
};
