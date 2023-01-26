import { MembershipRequestResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const user: MembershipRequestResolvers["user"] = async (parent) => {
  return await User.findOne({
    _id: parent.user,
  }).lean();
};
