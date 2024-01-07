import type { EventProjectResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const creator: EventProjectResolvers["creator"] = async (parent) => {
  return User.findOne({
    _id: parent.creatorId,
  }).lean();
};
