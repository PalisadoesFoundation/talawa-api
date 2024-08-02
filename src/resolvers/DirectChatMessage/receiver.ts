import type { DirectChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";

/**
 * Resolver function for the `receiver` field of a `DirectChatMessage`.
 *
 * This function retrieves the user who received a specific direct chat message.
 *
 * @param parent - The parent object representing the direct chat message. It contains information about the direct chat message, including the ID of the user who received it.
 * @returns A promise that resolves to the user document found in the database. This document represents the user who received the direct chat message.
 *
 * @see User - The User model used to interact with the users collection in the database.
 * @see DirectChatMessageResolvers - The type definition for the resolvers of the DirectChatMessage fields.
 *
 */
export const receiver: DirectChatMessageResolvers["receiver"] = async (
  parent,
) => {
  const result = await User.findOne({
    _id: parent.receiver,
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
