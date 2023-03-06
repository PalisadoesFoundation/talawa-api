import {
  CHAT_NOT_FOUND_ERROR,
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
} from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { GroupChat, Organization } from "../../models";
import { adminCheck } from "../../utilities";

export const removeUserFromGroupChat: MutationResolvers["removeUserFromGroupChat"] =
  async (_parent, args, context) => {
    const groupChat = await GroupChat.findOne({
      _id: args.chatId,
    }).lean();

    // Checks whether groupChat exists.
    if (!groupChat) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? CHAT_NOT_FOUND_ERROR.DESC
          : requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
        CHAT_NOT_FOUND_ERROR.CODE,
        CHAT_NOT_FOUND_ERROR.PARAM
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

    // Checks whether currentUser with _id == context.userId is an admin of organzation.
    adminCheck(context.userId, organization);

    const userIsMemberOfGroupChat = groupChat.users.some(
      (user) => user.toString() === args.userId.toString()
    );

    // Checks if user with _id === args.userId is not a member of groupChat.
    if (userIsMemberOfGroupChat === false) {
      throw new errors.UnauthorizedError(
        IN_PRODUCTION !== true
          ? USER_NOT_AUTHORIZED
          : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
        USER_NOT_AUTHORIZED_CODE,
        USER_NOT_AUTHORIZED_PARAM
      );
    }

    // Removes args.userId from users list of groupChat and returns the updated groupChat.
    return await GroupChat.findOneAndUpdate(
      {
        _id: args.chatId,
      },
      {
        $set: {
          users: groupChat.users.filter(
            (user) => user.toString() !== args.userId.toString()
          ),
        },
      },
      {
        new: true,
      }
    ).lean();
  };
