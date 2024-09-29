import type { GroupChatResolvers } from "../../types/generatedGraphQLTypes";
import { GroupChatMessage } from "../../models";

/**
 * Resolver function for the `messages` field of a `GroupChat`.
 *
 * This function retrieves the messages associated with a specific group chat.
 *
 * @param parent - The parent object representing the group chat. It contains information about the group chat, including the IDs of the messages associated with it.
 * @returns A promise that resolves to the message documents found in the database. These documents represent the messages associated with the group chat.
 *
 * @see GroupChatMessage - The GroupChatMessage model used to interact with the group chat messages collection in the database.
 * @see GroupChatResolvers - The type definition for the resolvers of the GroupChat fields.
 *
 */
export const messages: GroupChatResolvers["messages"] = async (parent) => {
  return await GroupChatMessage.find({
    _id: {
      $in: parent.messages,
    },
  }).lean();
};
