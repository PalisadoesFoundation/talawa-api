import { Types } from "mongoose";
import { CHAT_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
import { DirectChat } from "../../models";

/**
 * Throws error if there exists no `DirectChat` with the given `id` else returns matching `DirectChat` document
 * @param directChatId - `id` of the direct chat
 */
export const getValidDirectChatById = async (
  directChatId: string | Types.ObjectId
) => {
  const directChat = await DirectChat.findOne({
    _id: directChatId,
  }).lean();

  if (!directChat) {
    throw new errors.NotFoundError(
      requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
      CHAT_NOT_FOUND_ERROR.CODE,
      CHAT_NOT_FOUND_ERROR.PARAM
    );
  }

  return directChat;
};
