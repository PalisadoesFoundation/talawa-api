import { DirectChatMessageResolvers } from "../../../generated/graphqlCodegen";
import { DirectChat } from "../../models";

/**
 * This resolver method will retrieve and return from the database the Direct chat to which the specified message belongs.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the Direct chat data.
 */
export const directChatMessageBelongsTo: DirectChatMessageResolvers["directChatMessageBelongsTo"] =
  async (parent) => {
    return await DirectChat.findOne({
      _id: parent.directChatMessageBelongsTo,
    }).lean();
  };
