import { Types } from "mongoose";
import { CHAT_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { GroupChat } from "../../models";

/**
 * Throws error if there exists no `GroupChat` with the given `id` else returns matching `GroupChat` document
 * @param groupChatId - `id` of the group chat
 */
export const getValidGroupChatById = async (
  groupChatId: string | Types.ObjectId
) => {
  const groupChat = await GroupChat.findOne({
    _id: groupChatId,
  }).lean();

  if (!groupChat) {
    throw new errors.NotFoundError(
      requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
      CHAT_NOT_FOUND_ERROR.CODE,
      CHAT_NOT_FOUND_ERROR.PARAM
    );
  }

  return groupChat;
};
