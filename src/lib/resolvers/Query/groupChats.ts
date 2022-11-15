import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { GroupChat } from "../../models";

/**
 * This query fetch all the group chat from the database.
 * @returns An object containing a list of all group chat.
 */
export const groupChats: QueryResolvers["groupChats"] = async () => {
  return await GroupChat.find().lean();
};
