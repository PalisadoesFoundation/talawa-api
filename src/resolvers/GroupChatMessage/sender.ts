import type { GroupChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { User } from "../../models";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
/**
 * This resolver function will fetch and return the send of the group chat message from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that will contain the User data.
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
