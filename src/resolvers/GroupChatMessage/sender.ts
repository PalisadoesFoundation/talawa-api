import type { GroupChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";

/**
 * Resolver function for the `sender` field of a `GroupChatMessage`.
 *
 * This function retrieves the user who sent a specific group chat message.
 *
 * @param parent - The parent object representing the group chat message. It contains information about the group chat message, including the ID of the user who sent it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who sent the group chat message.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see GroupChatMessageResolvers - The type definition for the resolvers of the GroupChatMessage fields.
 *
 */
export const sender: GroupChatMessageResolvers["sender"] = async (parent) => {
  const result = await User.findOne({
    _id: parent.sender,
  }).lean();

  if (result) {
    return result;
  } else {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
};
