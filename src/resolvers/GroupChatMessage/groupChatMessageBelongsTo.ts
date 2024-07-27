import type { GroupChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { GroupChat } from "../../models";
import { errors, requestContext } from "../../libraries";
import { CHAT_NOT_FOUND_ERROR } from "../../constants";

/**
 * Resolver function for the `groupChatMessageBelongsTo` field of a `GroupChatMessage`.
 *
 * This function retrieves the group chat to which a specific group chat message belongs.
 *
 * @param parent - The parent object representing the group chat message. It contains information about the group chat message, including the ID of the group chat to which it belongs.
 * @returns A promise that resolves to the group chat document found in the database. This document represents the group chat to which the group chat message belongs.
 *
 * @see GroupChat - The GroupChat model used to interact with the group chats collection in the database.
 * @see GroupChatMessageResolvers - The type definition for the resolvers of the GroupChatMessage fields.
 *
 */
export const groupChatMessageBelongsTo: GroupChatMessageResolvers["groupChatMessageBelongsTo"] =
  async (parent) => {
    const result = await GroupChat.findOne({
      _id: parent.groupChatMessageBelongsTo,
    }).lean();

    if (result) {
      return result;
    } else {
      throw new errors.NotFoundError(
        requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
        CHAT_NOT_FOUND_ERROR.CODE,
        CHAT_NOT_FOUND_ERROR.PARAM,
      );
    }
  };
