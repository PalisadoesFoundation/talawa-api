import { User } from "../../models";
import type { EventVolunteerResolvers } from "../../types/generatedGraphQLTypes";

export const user: EventVolunteerResolvers["user"] = async (parent) => {
  return await User.findOne({
    _id: parent.userId,
  }).lean();
};
