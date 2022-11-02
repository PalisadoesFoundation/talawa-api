import { GroupChatMessageResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";

export const sender: GroupChatMessageResolvers["sender"] = async (parent) => {
  return await User.findOne({
    _id: parent.sender,
  }).lean();
};
