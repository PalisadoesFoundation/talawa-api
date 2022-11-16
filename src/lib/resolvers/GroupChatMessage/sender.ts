import { GroupChatMessageResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";

/**
 * This resolver function will fetch and return the send of the group chat message from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An object that will contain the User data.
 */
export const sender: GroupChatMessageResolvers["sender"] = async (parent) => {
  return await User.findOne({
    _id: parent.sender,
  }).lean();
};
