import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { DirectChatMessage } from "../../models";

export const directChatMessages: QueryResolvers["directChatMessages"] =
  async () => {
    return await DirectChatMessage.find().lean();
  };
