import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { DirectChatMessage } from "../../models";

/**
 * This query will fetch all existing Direct chat messages from the database.
 * @returns An `object` that contains list of existing direct chat messages.
 */
export const directChatMessages: QueryResolvers["directChatMessages"] =
  async () => {
    return await DirectChatMessage.find().lean();
  };
