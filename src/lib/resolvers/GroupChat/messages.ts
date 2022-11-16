import { GroupChatResolvers } from "../../../generated/graphqlCodegen";
import { GroupChatMessage } from "../../models";

/**
 * This resolver function will fetch and return the list of group chat message from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the list of group chat messages.
 */
export const messages: GroupChatResolvers["messages"] = async (parent) => {
  return await GroupChatMessage.find({
    _id: {
      $in: parent.messages,
    },
  }).lean();
};
