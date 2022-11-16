import { User } from "../../models";
import { DirectChatResolvers } from "../../../generated/graphqlCodegen";

/**
 * This resolver function will fetch and return the list of all direct chat users from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the list of users.
 */
export const users: DirectChatResolvers["users"] = async (parent) => {
  return await User.find({
    _id: {
      $in: parent.users,
    },
  }).lean();
};
