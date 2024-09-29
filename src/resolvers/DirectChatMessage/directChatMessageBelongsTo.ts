import type { DirectChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { DirectChat } from "../../models";
import { CHAT_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";

/**
 * Resolver function for the `directChatMessageBelongsTo` field of a `DirectChatMessage`.
 *
 * This function retrieves the direct chat to which a specific direct chat message belongs.
 *
 * @param parent - The parent object representing the direct chat message. It contains information about the direct chat message, including the ID of the direct chat to which it belongs.
 * @returns A promise that resolves to the direct chat document found in the database. This document represents the direct chat to which the direct chat message belongs.
 *
 * @see DirectChat - The DirectChat model used to interact with the direct chats collection in the database.
 * @see DirectChatMessageResolvers - The type definition for the resolvers of the DirectChatMessage fields.
 *
 */
export const directChatMessageBelongsTo: DirectChatMessageResolvers["directChatMessageBelongsTo"] =
  async (parent) => {
    const directChatResult = await DirectChat.findOne({
      _id: parent.directChatMessageBelongsTo,
    }).lean();

    if (directChatResult) {
      return directChatResult;
    } else {
      throw new errors.NotFoundError(
        requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
        CHAT_NOT_FOUND_ERROR.CODE,
        CHAT_NOT_FOUND_ERROR.PARAM,
      );
    }
  };
