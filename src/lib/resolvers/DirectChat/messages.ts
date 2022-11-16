import { DirectChatMessage } from "../../models";
import { DirectChatResolvers } from "../../../generated/graphqlCodegen";

/**
 * This resolver function will fetch and return the list of all messages in specified Direct Chat from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the list of messages.
 */
export const messages: DirectChatResolvers["messages"] = async (parent) => {
  return await DirectChatMessage.find({
    _id: {
      $in: parent.messages,
    },
  }).lean();
};
