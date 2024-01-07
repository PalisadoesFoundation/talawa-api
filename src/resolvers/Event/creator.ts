import type { EventResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creator: EventResolvers["creator"] = async (parent) => {
  return User.findOne({
    _id: parent.creatorId,
  }).lean();
};
