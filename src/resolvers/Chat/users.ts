import type { InterfaceChat, InterfaceUser } from "../../models";
import { User } from "../../models";
import type {
  ChatResolvers,
  ResolverTypeWrapper,
} from "../../types/generatedGraphQLTypes";
/**
 * This resolver function will fetch and return the list of all chat users from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @returns An `object` that contains the list of users.
 */
export const users: ChatResolvers["users"] = async (
  parent: InterfaceChat,
): Promise<ResolverTypeWrapper<InterfaceUser>[]> => {
  const users = await User.find({
    _id: {
      $in: parent.users,
    },
  }).lean();
  return users as ResolverTypeWrapper<InterfaceUser>[];
};
