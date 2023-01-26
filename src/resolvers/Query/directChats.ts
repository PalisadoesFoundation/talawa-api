import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { DirectChat } from "../../models";

export const directChats: QueryResolvers["directChats"] = async () => {
  return await DirectChat.find().lean();
};
