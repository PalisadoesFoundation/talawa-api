import { User } from "../../models";
import type { EventVolunteerGroupResolvers } from "../../types/generatedGraphQLTypes";

export const creator: EventVolunteerGroupResolvers["creator"] = async (
  parent
) => {
  return await User.findOne({
    _id: parent.creatorId,
  }).lean();
};
