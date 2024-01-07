import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creatorId: EventResolvers["creatorId"] = async (parent) => {
  return User.findOne({
    _id: parent.creatorId,
  }).lean();
};
