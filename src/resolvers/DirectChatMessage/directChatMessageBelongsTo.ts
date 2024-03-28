import type { DirectChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { DirectChat } from "../../models";
import { CHAT_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
/**
 * This resolver method will retrieve and return from the database the Direct chat to which the specified message belongs.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the Direct chat data.
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
