import {
  CHAT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { AppUserProfile, GroupChat, Organization, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";
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

export const adminRemoveGroup: MutationResolvers["adminRemoveGroup"] = async (
  _parent,
  args,
  context,
) => {
  const groupChat = await GroupChat.findOne({
    _id: args.groupId,
  }).lean();

  // Checks whether groupChat exists.
  if (!groupChat) {
    throw new errors.NotFoundError(
      requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
      CHAT_NOT_FOUND_ERROR.CODE,
      CHAT_NOT_FOUND_ERROR.PARAM,
    );
  }

  let organization;

  const organizationFoundInCache = await findOrganizationsInCache([
    groupChat.organization,
  ]);

  organization = organizationFoundInCache[0];

  if (organizationFoundInCache.includes(null)) {
    organization = await Organization.findOne({
      _id: groupChat.organization,
    }).lean();
    if (organization) {
      await cacheOrganizations([organization]);
    }
  }

  // Checks whether organization exists.
  if (!organization) {
    throw new errors.NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
      ORGANIZATION_NOT_FOUND_ERROR.CODE,
      ORGANIZATION_NOT_FOUND_ERROR.PARAM,
    );
  }

  const currentUserExists = !!(await User.exists({
    _id: context.userId,
  }));

  // Checks currentUser with _id === context.userId exists.
  if (currentUserExists === false) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  const currentUserAppProfile = await AppUserProfile.findOne({
    userId: context.userId,
  }).lean();
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }

  // Checks whether currentUser with _id === context.userId is an admin of organization.
  await adminCheck(context.userId, organization);

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
