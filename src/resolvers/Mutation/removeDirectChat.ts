import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { DirectChat, DirectChatMessage, Organization } from "../../models";
import { adminCheck } from "../../utilities";
import { errors, requestContext } from "../../libraries";
import {
  CHAT_NOT_FOUND_CODE,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
} from "../../constants";

export const removeDirectChat: MutationResolvers["removeDirectChat"] = async (
  _parent,
  args,
  context
) => {
  const organization = await Organization.findOne({
    _id: args.organizationId,
  }).lean();

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  const directChat = await DirectChat.findOne({
    _id: args.chatId,
  }).lean();

  // Checks whether directChat exists.
  if (!directChat) {
    throw new errors.NotFoundError(
      requestContext.translate(CHAT_NOT_FOUND_MESSAGE),
      CHAT_NOT_FOUND_CODE,
      CHAT_NOT_FOUND_PARAM
    );
  }

  // Checks whether currentUser with _id === context.userId is an admin of organzation.
  adminCheck(context.userId, organization);

  // Deletes all directChatMessages with _id as one of the ids in directChat.messages list.
  await DirectChatMessage.deleteMany({
    _id: {
      $in: directChat.messages,
    },
  });

  // Deletes the directChat.
  await DirectChat.deleteOne({
    _id: args.chatId,
  });

  // Returns deleted directChat.
  return directChat;
};
