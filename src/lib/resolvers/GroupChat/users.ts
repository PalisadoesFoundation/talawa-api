import { GroupChatResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";

/**
 * This resolver function will fetch and return the list of all Users of the Group Chat from database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the User data.
 */
export const users: GroupChatResolvers["users"] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.users,
    },
  }).lean();
};
