import { adminCheck } from "../../utilities";
import {
  CHAT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { GroupChat, GroupChatMessage, Organization } from "../../models";

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
      requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
      CHAT_NOT_FOUND_ERROR.CODE,
      CHAT_NOT_FOUND_ERROR.PARAM
    );
  }

  const organization = await Organization.findOne({
    _id: groupChat.organization,
  }).lean();

  // Checks if an organization with _id === groupChat.organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM
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
