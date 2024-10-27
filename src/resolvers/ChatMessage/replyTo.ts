import type { ChatMessageResolvers } from "../../types/generatedGraphQLTypes";
import { ChatMessage } from "../../models";
import { MESSAGE_NOT_FOUND_ERROR } from "../../constants";
import { errors, requestContext } from "../../libraries";
/**
 * This resolver function will fetch and return the message replied to specific to the chat from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains reply Message's data.
 */
export const replyTo: ChatMessageResolvers["replyTo"] = async (parent) => {
  if (parent.replyTo) {
    const result = await ChatMessage.findOne({
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
