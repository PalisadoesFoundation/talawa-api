import { User } from "../../models";
import { DirectChatResolvers } from "../../../generated/graphqlCodegen";

export const users: DirectChatResolvers["users"] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.users,
    },
  }).lean();
};
