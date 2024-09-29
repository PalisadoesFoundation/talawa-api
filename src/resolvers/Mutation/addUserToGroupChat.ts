import "dotenv/config";
import {
  CHAT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_ALREADY_MEMBER_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../constants";
import { errors, requestContext } from "../../libraries";
import { GroupChat, Organization, User } from "../../models";
import { cacheOrganizations } from "../../services/OrganizationCache/cacheOrganizations";
import { findOrganizationsInCache } from "../../services/OrganizationCache/findOrganizationsInCache";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { adminCheck } from "../../utilities";
import type { InterfaceGroupChat } from "../../models";

/**
 * Mutation resolver function to add a user to a group chat.
 *
 * This function performs the following actions:
 * 1. Checks if the group chat specified by `args.chatId` exists.
 * 2. Checks if the organization associated with the group chat exists.
 * 3. Verifies that the current user (identified by `context.userId`) is an admin of the organization.
 * 4. Confirms that the user to be added (specified by `args.userId`) exists.
 * 5. Ensures that the user is not already a member of the group chat.
 * 6. Adds the user to the list of users in the group chat and returns the updated group chat.
 *
 * @param _parent - The parent object for the mutation. This parameter is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `chatId`: The ID of the group chat to which the user will be added.
 *   - `userId`: The ID of the user to be added to the group chat.
 * @param context - The context for the mutation, including:
 *   - `userId`: The ID of the current user making the request.
 *
 * @returns A promise that resolves to the updated group chat document with the new user added.
 *
 * @see GroupChat - The GroupChat model used to interact with the group chats collection in the database.
 * @see Organization - The Organization model used to interact with the organizations collection in the database.
 * @see User - The User model used to interact with the users collection in the database.
 * @see MutationResolvers - The type definition for the mutation resolvers.
 * @see adminCheck - Utility function to check if the current user is an admin of the organization.
 * @see findOrganizationsInCache - Service function to retrieve organizations from cache.
 * @see cacheOrganizations - Service function to cache updated organization data.
 */
export const addUserToGroupChat: MutationResolvers["addUserToGroupChat"] =
  async (_parent, args, context) => {
    const groupChat = await GroupChat.findOne({
      _id: args.chatId,
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

    // Checks whether currentUser with _id === context.userId is an admin of organization.
    await adminCheck(context.userId, organization);

    const userExists = !!(await User.exists({
      _id: args.userId,
    }));

    // Checks whether user with _id === args.userId exists.
    if (userExists === false) {
      throw new errors.NotFoundError(
        requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      );
    }

    const isUserGroupChatMember = groupChat.users.some((user) =>
      user.equals(args.userId),
    );

    // Checks whether user with _id === args.userId is already a member of groupChat.
    if (isUserGroupChatMember === true) {
      throw new errors.ConflictError(
        requestContext.translate(USER_ALREADY_MEMBER_ERROR.MESSAGE),
        USER_ALREADY_MEMBER_ERROR.CODE,
        USER_ALREADY_MEMBER_ERROR.PARAM,
      );
    }

    // Adds args.userId to users list on groupChat's document and returns the updated groupChat.
    return (await GroupChat.findOneAndUpdate(
      {
        _id: args.chatId,
      },
      {
        $push: {
          users: args.userId,
        },
      },
      {
        new: true,
      },
    ).lean()) as InterfaceGroupChat;
  };
