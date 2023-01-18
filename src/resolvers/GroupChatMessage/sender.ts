import { GroupChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";

export const sender: GroupChatMessageResolvers["sender"] = async (parent) => {
  return await User.findOne({
    _id: parent.sender,
  }).lean();
};
