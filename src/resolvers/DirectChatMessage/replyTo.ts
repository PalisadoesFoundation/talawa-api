import type { DirectChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { DirectChatMessage } from "../../models";
import { MESSAGE_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
/**
 * This resolver function will fetch and return the receiver(user) of the Direct chat from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains User's data.
 */
export const replyTo: DirectChatMessageResolvers["replyTo"] = async (
  parent,
) => {
  console.log("PARENT ", parent);
  if (parent.replyTo) {
    const result = await DirectChatMessage.findOne({
      _id: parent.replyTo,
    }).lean();

    if (result) {
      return result;
    } else {
      throw new errors.NotFoundError(
        requestContext.translate(MESSAGE_NOT_FOUND_ERROR.MESSAGE),
        MESSAGE_NOT_FOUND_ERROR.CODE,
        MESSAGE_NOT_FOUND_ERROR.PARAM,
      );
    }
  } else {
    return null;
  }
};
