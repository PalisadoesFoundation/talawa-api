import { adminCheck } from "../../utilities";
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
import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { GroupChat, GroupChatMessage, Organization } from "../../models";
/**
 * This function enables to remove an graoup chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the group chat exists
 * 2. If the organization exists
 * 3. If the user is an admin of the organization.
 * @returns Deleted group chat.
 */
export const removeGroupChat: MutationResolvers["removeGroupChat"] = async (
  _parent,
  args,
  context
) => {
  const groupChat = await GroupChat.findOne({
    _id: args.chatId,
  }).lean();

  // Checks if a groupChat with _id === args.chatId exists.
  if (!groupChat) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? CHAT_NOT_FOUND
        : requestContext.translate(CHAT_NOT_FOUND_MESSAGE),
      CHAT_NOT_FOUND_CODE,
      CHAT_NOT_FOUND_PARAM
    );
  }

  const organization = await Organization.findOne({
    _id: groupChat.organization,
  }).lean();

  // Checks if an organization with _id === groupChat.organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  // Checks whether current user making the request is an admin of organization.
  adminCheck(context.userId, organization);

  // Delete all groupChatMessages that have their ids stored in messages list of groupChat
  await GroupChatMessage.deleteMany({
    _id: {
      $in: groupChat.messages,
    },
  });

  // Delete the groupChat
  await GroupChat.deleteOne({
    _id: groupChat._id,
  });

  return groupChat;
};
