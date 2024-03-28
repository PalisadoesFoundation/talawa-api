import { User } from "../../models";
import type { InterfaceUser } from "../../models";
import type { EventVolunteerGroupResolvers } from "../../types/generatedGraphQLTypes";

export const leader: EventVolunteerGroupResolvers["leader"] = async (
  parent,
) => {
  const groupLeader = await User.findOne({
    _id: parent.leaderId,
  }).lean();
  return groupLeader as InterfaceUser;
};
