import { EventVolunteerGroup } from "../../models";
import type { EventVolunteerResolvers } from "../../types/generatedGraphQLTypes";

export const group: EventVolunteerResolvers["group"] = async (parent) => {
  return await EventVolunteerGroup.findOne({
    _id: parent.groupId,
  }).lean();
};
