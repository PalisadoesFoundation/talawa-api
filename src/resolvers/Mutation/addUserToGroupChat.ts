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
 * This function adds user to group chat.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @param context - context of entire application
 * @remarks The following checks are done:
 * 1. If the group chat exists
 * 2. If the organization exists
 * 3. If the user trying to add the user is an admin of organization
 * 4. If the user exists
 * 5. If the user is already a member of the chat
 * @returns Updated Group chat
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
