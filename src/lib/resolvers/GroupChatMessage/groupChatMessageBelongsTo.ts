import { GroupChatMessageResolvers } from "../../../generated/graphqlCodegen";
import { GroupChat } from "../../models";

/**
 * This resolver method will retrieve and return from the database the Group chat to which the specified message belongs.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that contains the Group chat data.
 */
export const groupChatMessageBelongsTo: GroupChatMessageResolvers["groupChatMessageBelongsTo"] =
  async (parent) => {
    return await GroupChat.findOne({
      _id: parent.groupChatMessageBelongsTo,
    }).lean();
  };
