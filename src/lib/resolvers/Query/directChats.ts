import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { DirectChat } from "../../models";

/**
 * This query will fetch all existing Direct chats from the database.
 * @returns An `object` that contains list of existing direct chats.
 */
export const directChats: QueryResolvers["directChats"] = async () => {
  return await DirectChat.find().lean();
};
