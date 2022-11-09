import { DirectChatMessageResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";

export const sender: DirectChatMessageResolvers["sender"] = async (parent) => {
  return await User.findOne({
    _id: parent.sender,
  }).lean();
};
