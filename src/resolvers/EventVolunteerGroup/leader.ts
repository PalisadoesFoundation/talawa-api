import { User } from "../../models";
import type { EventVolunteerGroupResolvers } from "../../types/generatedGraphQLTypes";

export const leader: EventVolunteerGroupResolvers["leader"] = async (
  parent
) => {
  return await User.findOne({
    _id: parent.leaderId,
  }).lean();
};
