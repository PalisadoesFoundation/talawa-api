import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { GroupChatMessage } from "../../models";

/**
 * This query fetch all the group chat messages from the database.
 * @returns An object containing a list of all group chat messages.
 */
export const groupChatMessages: QueryResolvers["groupChatMessages"] =
  async () => {
    return await GroupChatMessage.find().lean();
  };
