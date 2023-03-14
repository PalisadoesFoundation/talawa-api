import {
  CHAT_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
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
        requestContext.translate(CHAT_NOT_FOUND_ERROR.MESSAGE),
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
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    // Checks whether currentUser with _id == context.userId is an admin of organzation.
    await adminCheck(context.userId, organization);

    const userIsMemberOfGroupChat = groupChat.users.some(
      (user) => user.toString() === args.userId.toString()
    );

    // Checks if user with _id === args.userId is not a member of groupChat.
    if (userIsMemberOfGroupChat === false) {
      throw new errors.UnauthorizedError(
        requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
        USER_NOT_AUTHORIZED_ERROR.CODE,
        USER_NOT_AUTHORIZED_ERROR.PARAM
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
