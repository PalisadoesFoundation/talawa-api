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
 * Mutation resolver function to remove a group chat.
 *
 * This function performs the following actions:
 * 1. Checks if the group chat specified by `args.groupId` exists.
 * 2. Verifies that the organization associated with the group chat exists.
 * 3. Ensures that the current user (identified by `context.userId`) exists.
 * 4. Checks that the current user is authorized as an admin of the organization.
 * 5. Deletes the group chat from the database.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `groupId`: The ID of the group chat to be removed.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user making the request.
 *
 * @returns A promise that resolves to the deleted group chat document.
 *
 * @see GroupChat - The GroupChat model used to interact with the group chats collection in the database.
 * @see Organization - The Organization model used to interact with the organizations collection in the database.
 * @see User - The User model used to interact with the users collection in the database.
 * @see AppUserProfile - The AppUserProfile model used to retrieve the user's profile information.
 * @see MutationResolvers - The type definition for the mutation resolvers.
 * @see adminCheck - Utility function to check if the current user is an admin of the organization.
 * @see findOrganizationsInCache - Service function to retrieve organizations from cache.
 * @see cacheOrganizations - Service function to cache updated organization data.
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
