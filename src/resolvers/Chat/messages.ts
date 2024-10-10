import { ChatMessage } from "../../models";
import type { ChatResolvers } from "../../types/generatedGraphQLTypes";
/**
 * This resolver function will fetch and return the list of all messages in specified Chat from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the list of messages.
 */
export const messages: ChatResolvers["messages"] = async (parent) => {
  return await ChatMessage.find({
    _id: {
      $in: parent.messages,
    },
  }).lean();
};
