import { DirectChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { DirectChat } from "../../models";

export const directChatMessageBelongsTo: DirectChatMessageResolvers["directChatMessageBelongsTo"] =
  async (parent) => {
    return await DirectChat.findOne({
      _id: parent.directChatMessageBelongsTo,
    }).lean();
  };
