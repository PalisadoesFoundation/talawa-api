import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { DirectChat, DirectChatMessage, Organization } from "../../models";
import { adminCheck } from "../../utilities";
import { errors, requestContext } from "../../libraries";
import {
  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_CODE,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_PARAM,
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
} from "../../../constants";
/**
 * This function enables to remove direct chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the organization exists
 * 2. If the chat exists
 * 3. If the user is an admin of the organization.
 * @returns Deleted chat.
 */
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
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
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
      IN_PRODUCTION !== true
        ? CHAT_NOT_FOUND
        : requestContext.translate(CHAT_NOT_FOUND_MESSAGE),
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
