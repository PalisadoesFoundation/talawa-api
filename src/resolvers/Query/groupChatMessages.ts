import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { GroupChatMessage } from "../../models";

export const groupChatMessages: QueryResolvers["groupChatMessages"] =
  async () => {
    return await GroupChatMessage.find().lean();
  };
