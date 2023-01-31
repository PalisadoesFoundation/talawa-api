import { User } from "../../models";
import { DirectChatResolvers } from "../../types/generatedGraphQLTypes";

export const creator: DirectChatResolvers["creator"] = async (parent) => {
  return await User.findOne({
    _id: parent.creator,
  }).lean();
};
