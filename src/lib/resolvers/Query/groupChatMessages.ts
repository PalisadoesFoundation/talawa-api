import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { GroupChatMessage } from "../../models";

export const groupChatMessages: QueryResolvers["groupChatMessages"] =
  async () => {
    return await GroupChatMessage.find().lean();
  };
