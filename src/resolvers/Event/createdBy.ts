import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const createdBy: EventResolvers["createdBy"] = async (parent) => {
  return User.findOne({
    _id: parent.createdBy,
  }).lean();
};
