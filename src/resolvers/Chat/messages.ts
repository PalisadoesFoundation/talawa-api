import type { InterfaceChatMessage } from "../../models";
import { ChatMessage } from "../../models";
import type {
  ChatResolvers,
  ResolverTypeWrapper,
} from "../../types/generatedGraphQLTypes";
import type { Types } from "mongoose";

/**
 * This resolver function will fetch and return the list of all messages in specified Chat from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the list of messages.
 */
export const messages: ChatResolvers["messages"] = async (
  parent,
  _args,
  context,
): Promise<ResolverTypeWrapper<InterfaceChatMessage>[]> => {
  if (!parent.messages?.length) return [];

  const messages = await ChatMessage.find({
    _id: {
      $in: parent.messages as Types.ObjectId[],
    },
  }).lean();

  return messages.map((message) => ({
    ...message,
    media: message.media ? `${context.apiRootUrl}${message.media}` : message.media,
  })) as ResolverTypeWrapper<InterfaceChatMessage>[];
};