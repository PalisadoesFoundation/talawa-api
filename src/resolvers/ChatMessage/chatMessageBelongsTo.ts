import type { ChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { Chat } from "../../models";
import { CHAT_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
/**
 * This resolver method will retrieve and return from the database the Chat to which the specified message belongs.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the Chat data.
 */
export const chatMessageBelongsTo: ChatMessageResolvers["chatMessageBelongsTo"] =
  async (parent) => {
    const chatResult = await Chat.findOne({
      _id: parent.chatMessageBelongsTo,
    }).lean();

    if (chatResult) {
      return chatResult;
    } else {
      throw new errors.NotFoundError(
        requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
        CHAT_NOT_FOUND_ERROR.CODE,
        CHAT_NOT_FOUND_ERROR.PARAM,
      );
    }
  };
