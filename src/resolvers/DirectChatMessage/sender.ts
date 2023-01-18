import { DirectChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const sender: DirectChatMessageResolvers["sender"] = async (parent) => {
  return await User.findOne({
    _id: parent.sender,
  }).lean();
};
