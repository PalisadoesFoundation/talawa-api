import { User } from "../../models";
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

export const members: OrganizationResolvers["members"] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.members,
    },
  }).lean();
};
