import { User } from "../../models";
import { OrganizationResolvers } from "../../types/generatedGraphQLTypes";

export const blockedUsers: OrganizationResolvers["blockedUsers"] = async (
  parent
) => {
  return await User.find({
    _id: {
      $in: parent.blockedUsers,
    },
  }).lean();
};
