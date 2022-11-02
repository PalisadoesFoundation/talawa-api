import { MembershipRequestResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";

export const user: MembershipRequestResolvers["user"] = async (parent) => {
  return await User.findOne({
    _id: parent.user,
  }).lean();
};
