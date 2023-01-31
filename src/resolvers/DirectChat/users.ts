import { User } from "../../models";
import { DirectChatResolvers } from "../../types/generatedGraphQLTypes";

export const users: DirectChatResolvers["users"] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.users,
    },
  }).lean();
};
