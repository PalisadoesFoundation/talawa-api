import type { EventProjectResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creatorId: EventProjectResolvers["creatorId"] = async (parent) => {
  return User.findOne({
    _id: parent.creatorId,
  }).lean();
};
