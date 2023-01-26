import { GroupChatResolvers } from "../../types/generatedGraphQLTypes";
import { GroupChatMessage } from "../../models";

export const messages: GroupChatResolvers["messages"] = async (parent) => {
  return await GroupChatMessage.find({
    _id: {
      $in: parent.messages,
    },
  }).lean();
};
