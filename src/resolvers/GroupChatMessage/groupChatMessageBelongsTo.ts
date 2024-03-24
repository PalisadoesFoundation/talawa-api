import type { GroupChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { GroupChat } from "../../models";
import { errors, requestContext } from "../../libraries";
import { CHAT_NOT_FOUND_ERROR } from "../../constants";
/**
 * This resolver method will retrieve and return from the database the Group chat to which the specified message belongs.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the Group chat data.
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
