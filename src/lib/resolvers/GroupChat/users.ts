import { GroupChatResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";

export const users: GroupChatResolvers["users"] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.users,
    },
  }).lean();
};
