import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { User, MessageChat } from "../../models";
import { errors, requestContext } from "../../libraries";
import { USER_NOT_FOUND_ERROR } from "../../constants";
/**
 * This function enables to create a chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the receiver user exists
 * 2. If the sender and receiver users have same language code.
 * @returns Created message chat.
 */
export const createMessageChat: MutationResolvers["createMessageChat"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  }).lean();

  const receiverUser = await User.findOne({
    _id: args.data.receiver,
  }).lean();

  // Checks whether receiverUser exists.
  if (!receiverUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  // Boolean to identify whether both sender and receiver for messageChat have the same appLanguageCode.
  const isSenderReceiverLanguageSame =
    receiverUser?.appLanguageCode === currentUser?.appLanguageCode;

  // Creates new messageChat.
  const createdMessageChat = await MessageChat.create({
    sender: currentUser?._id,
    receiver: receiverUser._id,
    message: args.data.message,
    languageBarrier: !isSenderReceiverLanguageSame,
  });

  context.pubsub.publish("CHAT_CHANNEL", {
    directMessageChat: {
      ...createdMessageChat,
    },
  });

  // Returns createdMessageChat.
  return createdMessageChat.toObject();
};
