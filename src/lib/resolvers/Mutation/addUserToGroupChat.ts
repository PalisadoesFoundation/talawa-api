import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { errors, requestContext } from "../../libraries";
import { adminCheck } from "../../utilities";
import { User, GroupChat, Organization } from "../../models";
import {
  IN_PRODUCTION,
  CHAT_NOT_FOUND,
  CHAT_NOT_FOUND_MESSAGE,
  CHAT_NOT_FOUND_CODE,
  CHAT_NOT_FOUND_PARAM,
  USER_ALREADY_MEMBER,
  USER_ALREADY_MEMBER_CODE,
  USER_ALREADY_MEMBER_MESSAGE,
  USER_ALREADY_MEMBER_PARAM,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} from "../../../constants";
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

    // Checks whether currentUser with _id === context.userId is an admin of organization.
    adminCheck(context.userId, organization);

    const userExists = await User.exists({
      _id: args.userId,
    });

    // Checks whether user with _id === args.userId exists.
    if (userExists === false) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? USER_NOT_FOUND
          : requestContext.translate(USER_NOT_FOUND_MESSAGE),
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_PARAM
      );
    }

    const isUserGroupChatMember = groupChat.users.some(
      (user) => user.toString() === args.userId.toString()
    );

    // Checks whether user with _id === args.userId is already a member of groupChat.
    if (isUserGroupChatMember === true) {
      throw new errors.ConflictError(
        IN_PRODUCTION !== true
          ? USER_ALREADY_MEMBER
          : requestContext.translate(USER_ALREADY_MEMBER_MESSAGE),
        USER_ALREADY_MEMBER_CODE,
        USER_ALREADY_MEMBER_PARAM
      );
    }

    // Adds args.userId to users list on groupChat's document and returns the updated groupChat.
    return await GroupChat.findOneAndUpdate(
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
      }
    ).lean();
  };
