import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import { User, Organization, GroupChat } from "../../models";
import {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_PARAM,
  CHAT_NOT_FOUND_CODE,
  CHAT_NOT_FOUND_MESSAGE,
} from "../../../constants";

/**
 * This function enables an admin to remove a group.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the group chat exists
 * 2. If the organization exists
 * 3. If the user exists
 * 4. If the user is an admin of organization
 * @returns Deleted group chat
 */

// @ts-ignore
export const adminRemoveGroup: MutationResolvers["adminRemoveGroup"] = async (
  _parent,
  args,
  context
) => {
  const groupChat = await GroupChat.findOne({
    _id: args.groupId,
  }).lean();

  // Checks whether groupChat exists.
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

  const currentUserExists = await User.exists({
    _id: context.userId,
  });

  // Checks currentUser with _id === context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      IN_PRODUCTION !== true
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // Checks whether currentUser with _id === context.userId is an admin of organization.
  adminCheck(context.userId, organization);

  //remove message from organization
  // org.overwrite({
  //   ...org._doc,
  //   messages: org._doc.posts.filter((message) => message != args.messageId),
  // });
  // await org.save();

  // //remove post from user
  // user.overwrite({
  //   ...user._doc,
  //   messages: user._doc.posts.filter((message) => message != args.messageId),
  // });
  // await user.save();

  // Deletes the groupChat.
  await GroupChat.deleteOne({
    _id: groupChat._id,
  });

  // Returns the deleted groupChat.
  return groupChat;
};
