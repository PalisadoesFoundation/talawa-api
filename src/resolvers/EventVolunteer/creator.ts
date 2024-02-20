import { User } from "../../models";
import type { EventVolunteerResolvers } from "../../types/generatedGraphQLTypes";

export const creator: EventVolunteerResolvers["creator"] = async (parent) => {
  return await User.findOne({
    _id: parent.creatorId,
  }).lean();
};
